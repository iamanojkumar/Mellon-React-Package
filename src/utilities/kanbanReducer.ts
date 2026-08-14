/**
 * The Kanban board's data model and its one pure state transition.
 *
 * Every board mutation — a pointer drag, a keyboard move, and (in the AI
 * layer) a model-proposed command — goes through `applyKanbanCommands`.
 * That is deliberate: a drag and an AI move are the *same* operation
 * expressed two ways, so they must not be two implementations that drift
 * apart on edge cases like index clamping or same-column reordering.
 *
 * Nothing here touches React, the DOM, or an AI client, so the whole
 * behavioural surface is unit-testable — which matters because jsdom
 * cannot exercise the drag that produces these commands.
 */

export type KanbanCardStatus = 'success' | 'warning' | 'danger';

export interface KanbanAssignee {
  id: string;
  name: string;
  avatarSrc?: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  assignee?: KanbanAssignee;
  tags?: string[];
  /**
   * Semantic status. Rendered through `Badge`, which ships an icon and a
   * visually-hidden status word alongside the hue — status colour is never
   * the sole carrier of meaning (see CLAUDE.md's standing rule).
   */
  status?: KanbanCardStatus;
  /** Opaque consumer data. Never inspected here; forwarded to AI prompts only. */
  meta?: Record<string, unknown>;
}

export interface KanbanColumnData {
  id: string;
  title: string;
  /**
   * Card order lives on the column, not as a `columnId` on the card. That
   * makes a move a pure list splice and makes "what order is this column
   * in" a single readable array rather than a sort over a flat card list.
   */
  cardIds: string[];
  /**
   * Advisory only — a column over its limit is *reported*, never enforced.
   * Blocking the drop would strand a card mid-move with no way to finish,
   * so the board surfaces the overflow and lets the human decide.
   */
  wipLimit?: number;
}

export interface KanbanBoardData {
  columns: KanbanColumnData[];
  /** Normalized by id, so `update`/`delete` are O(1) and no card is duplicated across columns. */
  cards: Record<string, KanbanCard>;
}

export type KanbanCommand =
  | { op: 'move'; cardId: string; toColumnId: string; index?: number }
  | { op: 'create'; columnId: string; card: KanbanCard; index?: number }
  | { op: 'update'; cardId: string; patch: Partial<Omit<KanbanCard, 'id'>> }
  | { op: 'delete'; cardId: string };

export interface KanbanRejectedCommand {
  command: KanbanCommand;
  /** Human-readable, safe to render — the change preview shows these verbatim. */
  reason: string;
}

export interface KanbanApplyResult {
  board: KanbanBoardData;
  applied: KanbanCommand[];
  rejected: KanbanRejectedCommand[];
}

/** The column currently holding `cardId`, or `undefined` if no column does. */
export function findColumnOfCard(
  board: KanbanBoardData,
  cardId: string,
): KanbanColumnData | undefined {
  return board.columns.find((column) => column.cardIds.includes(cardId));
}

/** `true` when the column holds more cards than its own `wipLimit` allows. Advisory — see `wipLimit`. */
export function isOverWipLimit(column: KanbanColumnData): boolean {
  return column.wipLimit !== undefined && column.cardIds.length > column.wipLimit;
}

function clampIndex(index: number | undefined, length: number): number {
  if (index === undefined || Number.isNaN(index)) return length;
  if (index < 0) return 0;
  return index > length ? length : index;
}

function withCardIds(
  board: KanbanBoardData,
  columnId: string,
  next: (cardIds: string[]) => string[],
): KanbanColumnData[] {
  return board.columns.map((column) =>
    column.id === columnId ? { ...column, cardIds: next(column.cardIds) } : column,
  );
}

function applyOne(board: KanbanBoardData, command: KanbanCommand): KanbanBoardData | string {
  switch (command.op) {
    case 'move': {
      const source = findColumnOfCard(board, command.cardId);
      if (!source) return `Unknown card "${command.cardId}"`;
      const target = board.columns.find((column) => column.id === command.toColumnId);
      if (!target) return `Unknown column "${command.toColumnId}"`;

      // Remove first, then insert — so `index` always means "position in the
      // destination as the user sees it once the card has left its old slot".
      // Without this, dragging a card down within one column lands it one
      // position short of where it was dropped.
      const detached = board.columns.map((column) => ({
        ...column,
        cardIds: column.cardIds.filter((id) => id !== command.cardId),
      }));

      const destination = detached.find((column) => column.id === command.toColumnId);
      if (!destination) return `Unknown column "${command.toColumnId}"`;
      const at = clampIndex(command.index, destination.cardIds.length);

      return {
        ...board,
        columns: detached.map((column) =>
          column.id === command.toColumnId
            ? {
                ...column,
                cardIds: [
                  ...column.cardIds.slice(0, at),
                  command.cardId,
                  ...column.cardIds.slice(at),
                ],
              }
            : column,
        ),
      };
    }

    case 'create': {
      const column = board.columns.find((candidate) => candidate.id === command.columnId);
      if (!column) return `Unknown column "${command.columnId}"`;
      if (board.cards[command.card.id]) return `Card "${command.card.id}" already exists`;

      const at = clampIndex(command.index, column.cardIds.length);
      return {
        cards: { ...board.cards, [command.card.id]: command.card },
        columns: withCardIds(board, command.columnId, (cardIds) => [
          ...cardIds.slice(0, at),
          command.card.id,
          ...cardIds.slice(at),
        ]),
      };
    }

    case 'update': {
      const existing = board.cards[command.cardId];
      if (!existing) return `Unknown card "${command.cardId}"`;
      return {
        ...board,
        cards: { ...board.cards, [command.cardId]: { ...existing, ...command.patch } },
      };
    }

    case 'delete': {
      if (!board.cards[command.cardId]) return `Unknown card "${command.cardId}"`;
      const cards = { ...board.cards };
      delete cards[command.cardId];
      return {
        cards,
        columns: board.columns.map((column) => ({
          ...column,
          cardIds: column.cardIds.filter((id) => id !== command.cardId),
        })),
      };
    }
  }
}

/**
 * Applies commands in order, skipping any that don't hold against the board
 * *as of that point in the sequence* — so a `create` followed by a `move` of
 * the card it just created both succeed, while a command naming a card that
 * never existed is dropped rather than throwing.
 *
 * Dropping instead of throwing is the load-bearing choice: these commands can
 * originate from a language model, and a single hallucinated id must not take
 * down the board or leave it half-mutated. Every rejection is reported so the
 * caller can show what was ignored.
 */
export function applyKanbanCommands(
  board: KanbanBoardData,
  commands: KanbanCommand[],
): KanbanApplyResult {
  const applied: KanbanCommand[] = [];
  const rejected: KanbanRejectedCommand[] = [];

  const next = commands.reduce<KanbanBoardData>((current, command) => {
    const result = applyOne(current, command);
    if (typeof result === 'string') {
      rejected.push({ command, reason: result });
      return current;
    }
    applied.push(command);
    return result;
  }, board);

  return { board: next, applied, rejected };
}

/**
 * What `applyKanbanCommands` *would* do, without keeping the resulting board.
 * The change preview uses this to show which proposed commands survive
 * validation before the user accepts any of them.
 */
export function validateKanbanCommands(
  board: KanbanBoardData,
  commands: KanbanCommand[],
): { applied: KanbanCommand[]; rejected: KanbanRejectedCommand[] } {
  const { applied, rejected } = applyKanbanCommands(board, commands);
  return { applied, rejected };
}
