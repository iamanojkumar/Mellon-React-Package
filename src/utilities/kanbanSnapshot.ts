import type { KanbanBoardData } from './kanbanReducer';

/**
 * The board, reduced to what a language model needs to name things
 * unambiguously and nothing more.
 *
 * Two rules shape this. **Ids are never dropped** — a model that can't cite a
 * stable id can only refer to cards by title, and duplicate or near-duplicate
 * titles are exactly where that goes wrong. And **truncation is
 * deterministic**, because a prompt that silently changes shape at ~200 cards
 * produces failures nobody can reproduce.
 */

export interface KanbanSnapshotCard {
  id: string;
  title: string;
  description?: string;
  status?: string;
  assignee?: string;
  tags?: string[];
}

export interface KanbanSnapshotColumn {
  id: string;
  title: string;
  wipLimit?: number;
  cards: KanbanSnapshotCard[];
}

export interface KanbanSnapshot {
  columns: KanbanSnapshotColumn[];
  /** `true` when the card budget was hit and some cards are absent. */
  truncated: boolean;
  omittedCardCount: number;
}

export interface KanbanSnapshotOptions {
  /** Total cards to include across all columns. Defaults to 120. */
  maxCards?: number;
  /** Longest description kept, in characters. Defaults to 120. Longer ones are cut with an ellipsis. */
  maxDescriptionLength?: number;
}

export const DEFAULT_KANBAN_SNAPSHOT_OPTIONS: Required<KanbanSnapshotOptions> = {
  maxCards: 120,
  maxDescriptionLength: 120,
};

/**
 * Serializes the board for a prompt, in column order, stopping once the card
 * budget is spent.
 *
 * Every column always appears even when its cards were cut — a model that
 * can't see a column can't move anything into it, so dropping columns would
 * quietly remove valid destinations. Cards are dropped from the end instead,
 * and the count of what was omitted rides along so the prompt can say so
 * rather than presenting a partial board as complete.
 */
export function kanbanSnapshot(
  board: KanbanBoardData,
  options?: KanbanSnapshotOptions,
): KanbanSnapshot {
  const maxCards = options?.maxCards ?? DEFAULT_KANBAN_SNAPSHOT_OPTIONS.maxCards;
  const maxDescriptionLength =
    options?.maxDescriptionLength ?? DEFAULT_KANBAN_SNAPSHOT_OPTIONS.maxDescriptionLength;

  let budget = maxCards;
  let omittedCardCount = 0;

  const columns = board.columns.map((column) => {
    const cards: KanbanSnapshotCard[] = [];

    for (const cardId of column.cardIds) {
      const card = board.cards[cardId];
      if (!card) continue;
      if (budget <= 0) {
        omittedCardCount += 1;
        continue;
      }
      budget -= 1;

      const description =
        card.description && card.description.length > maxDescriptionLength
          ? `${card.description.slice(0, maxDescriptionLength)}…`
          : card.description;

      cards.push({
        id: card.id,
        title: card.title,
        ...(description ? { description } : {}),
        ...(card.status ? { status: card.status } : {}),
        ...(card.assignee ? { assignee: card.assignee.name } : {}),
        ...(card.tags?.length ? { tags: card.tags } : {}),
      });
    }

    return {
      id: column.id,
      title: column.title,
      ...(column.wipLimit === undefined ? {} : { wipLimit: column.wipLimit }),
      cards,
    };
  });

  return { columns, truncated: omittedCardCount > 0, omittedCardCount };
}

/**
 * The default instruction sent when the consumer hasn't supplied a
 * `resolveCommands` of their own.
 *
 * It states the command vocabulary because the fallback path has to parse the
 * model's text — a consumer using real tool-calling never sees this and
 * defines the schema on their own side instead. The "answer in prose" and
 * "ask instead of guessing" clauses matter as much as the schema: without
 * them a model asked "what's blocked?" invents moves, and a model given an
 * under-specified request invents a card.
 */
export function buildKanbanPrompt(prompt: string, snapshot: KanbanSnapshot): string {
  return [
    'You are operating a Kanban board. Respond with a single JSON object and nothing else.',
    '',
    'Shape:',
    '{"commands": [...], "message": "optional prose", "highlightCardIds": ["optional card ids"]}',
    '',
    'Allowed commands (use the exact ids from the board below, never titles):',
    '{"op":"move","cardId":"...","toColumnId":"...","index":0}',
    '{"op":"create","columnId":"...","card":{"id":"...","title":"..."},"index":0}',
    '{"op":"update","cardId":"...","patch":{"title":"...","status":"success|warning|danger"}}',
    '{"op":"delete","cardId":"..."}',
    '',
    'Rules:',
    '- If the request is a question rather than an instruction, return no commands. Answer in "message" and list the relevant cards in "highlightCardIds".',
    '- If the request is ambiguous, return no commands and ask for the missing detail in "message". Do not guess.',
    '- Only reference ids that appear in the board below.',
    snapshot.truncated
      ? `- The board is truncated: ${snapshot.omittedCardCount} card(s) are not shown. Say so if it affects your answer.`
      : '',
    '',
    'Board:',
    JSON.stringify(snapshot.columns),
    '',
    'Request:',
    prompt,
  ]
    .filter(Boolean)
    .join('\n');
}
