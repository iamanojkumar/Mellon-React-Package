import { Fragment, forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { Dropdown } from '../Dropdown/Dropdown';
import { IconButton } from '../IconButton/IconButton';
import type { PointerDragDelta } from '../../hooks/usePointerDrag';
import { KanbanColumn } from '../KanbanColumn/KanbanColumn';
import { KanbanCard } from '../KanbanCard/KanbanCard';
import { DEFAULT_KANBAN_STATUS_LABELS } from '../KanbanCard/KanbanCard';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { KanbanPromptBar } from '../KanbanPromptBar/KanbanPromptBar';
import { KanbanChangePreview } from '../KanbanChangePreview/KanbanChangePreview';
import type { KanbanStatusLabels } from '../KanbanCard/KanbanCard';
import { useControllableState } from '../../hooks/useControllableState';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useKanbanCommands } from '../../hooks/useKanbanCommands';
import type { KanbanCommandResolver } from '../../hooks/useKanbanCommands';
import type { KanbanSnapshotOptions } from '../../utilities/kanbanSnapshot';
import { ToastContext } from '../../contexts/ToastContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { applyKanbanCommands, findColumnOfCard } from '../../utilities/kanbanReducer';
import type {
  KanbanBoardData,
  KanbanCard as KanbanCardData,
  KanbanCommand,
} from '../../utilities/kanbanReducer';
import styles from './KanbanBoard.module.css';

export interface KanbanBoardOwnProps {
  board?: KanbanBoardData;
  defaultBoard?: KanbanBoardData;
  onBoardChange?: (board: KanbanBoardData) => void;
  /**
   * Fires for each command actually applied, drag and keyboard alike. This
   * is the audit seam: because every path funnels through
   * `applyKanbanCommands`, a consumer can persist moves without caring which
   * input produced them.
   */
  onCommand?: (command: KanbanCommand) => void;
  statusLabels?: KanbanStatusLabels;
  renderCard?: (card: KanbanCardData) => ReactNode;
  emptyColumnState?: ReactNode;
  /** Accessible name for the board region. */
  'aria-label'?: string;
  /** Blocks both drag and keyboard moves. The board stays readable and focusable. */
  disabled?: boolean;

  /**
   * Per-card overflow menu offering "Move to <column>" and "Delete". On by
   * default: dragging is the only other pointer affordance, and it's both
   * undiscoverable and impossible on touch without a long press.
   *
   * Every item goes through the same reducer and `onCommand` as a drag, and
   * the board is controlled, so a consumer sees and can refuse each change.
   */
  cardMenu?: boolean;
  /** Hides `Delete` from the built-in menu, leaving only the move targets. */
  hideCardDelete?: boolean;
  /**
   * Extra actions rendered in the card's corner, before the overflow menu.
   * Pointer events inside are not treated as the start of a drag.
   */
  cardActions?: (card: KanbanCardData) => ReactNode;

  /**
   * Adds the natural-language prompt bar — "move the login bug to In Review",
   * "what's blocked?". Off by default, and **renders nothing at all** unless
   * there's a way to resolve a prompt: either an ancestor `AIProvider` or a
   * `resolveCommands` of your own. With neither, the board's output is
   * byte-identical to the non-AI rendering.
   */
  aiPrompt?: boolean;
  /**
   * Consumer-owned transport producing a `KanbanResolution` — tool-calling,
   * JSON mode, a server round-trip, whatever. Omit it and the board falls back
   * to `AIClient.complete` plus text parsing, which works with any client but
   * depends on the model returning the documented JSON.
   *
   * Supplying this is itself an opt-in, so it enables the prompt bar with or
   * without an `AIProvider` mounted.
   */
  resolveCommands?: KanbanCommandResolver;
  /** Caps how much board goes into a prompt. See `kanbanSnapshot`. */
  snapshotOptions?: KanbanSnapshotOptions;
  promptPlaceholder?: string;
}

export type KanbanBoardProps = Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children'> &
  KanbanBoardOwnProps;

interface LiftState {
  cardId: string;
  /** Where the card sat when it was picked up, so Escape can put it back exactly. */
  originColumnId: string;
  originIndex: number;
}

const EMPTY_BOARD: KanbanBoardData = { columns: [], cards: {} };

/**
 * Pixels of movement before a press counts as a drag. Component-intrinsic
 * gesture geometry with no matching token — it's a property of human hands,
 * not of the design language.
 */
const DRAG_THRESHOLD = 3;

/**
 * The line showing exactly where the card will land. Without it a drag only
 * tells you *which column* you're over, which is the difference between
 * dropping a card and guessing.
 *
 * `aria-hidden` because it's pure pointer feedback — the keyboard path already
 * announces every position change through the live region.
 */
function DropIndicator() {
  return <li aria-hidden="true" className={styles.dropIndicator} />;
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <circle cx="4" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="16" cy="10" r="1.6" fill="currentColor" />
    </svg>
  );
}

function positionOf(board: KanbanBoardData, cardId: string): { columnId: string; index: number } {
  const column = findColumnOfCard(board, cardId);
  if (!column) return { columnId: '', index: -1 };
  return { columnId: column.id, index: column.cardIds.indexOf(cardId) };
}

/**
 * A controlled Kanban board with two independent, equally complete move
 * paths: pointer drag and keyboard.
 *
 * The keyboard path is not a fallback. The other non-pointer way to drive
 * this board — the AI prompt bar — is inert whenever no `AIProvider` is
 * mounted, so it can never be the accessibility story; keyboard moves have
 * to stand on their own. Pick up with Space/Enter, move with arrows, drop
 * with Space/Enter, cancel with Escape, with each step announced through a
 * live region.
 *
 * Both paths emit the same `KanbanCommand`s through the same pure reducer,
 * so drag and keyboard cannot disagree about index semantics.
 */
const KanbanBoardRoot = forwardRef<HTMLDivElement, KanbanBoardProps>(function KanbanBoard(
  {
    board: controlledBoard,
    defaultBoard,
    onBoardChange,
    onCommand,
    statusLabels = DEFAULT_KANBAN_STATUS_LABELS,
    renderCard,
    emptyColumnState,
    disabled = false,
    cardMenu = true,
    hideCardDelete = false,
    cardActions,
    aiPrompt = false,
    resolveCommands,
    snapshotOptions,
    promptPlaceholder,
    className,
    'aria-label': ariaLabel = 'Board',
    ...rest
  },
  ref,
) {
  const [board, setBoard] = useControllableState<KanbanBoardData>({
    value: controlledBoard,
    defaultValue: defaultBoard ?? EMPTY_BOARD,
    onChange: onBoardChange,
  });

  const [focusedCardId, setFocusedCardId] = useState<string | undefined>(undefined);
  const [lift, setLift] = useState<LiftState | undefined>(undefined);
  const [dragCardId, setDragCardId] = useState<string | undefined>(undefined);
  /** Where the drop would land — drives both the indicator and the column highlight. */
  const [dropTarget, setDropTarget] = useState<{ columnId: string; index: number } | undefined>(
    undefined,
  );
  /** Cumulative pointer delta, so the dragged card tracks the cursor. */
  const [dragOffset, setDragOffset] = useState<PointerDragDelta | undefined>(undefined);
  const [announcement, setAnnouncement] = useState('');

  const [highlightedCardIds, setHighlightedCardIds] = useState<string[]>([]);

  const columnRefs = useRef(new Map<string, HTMLElement>());
  const cardRefs = useRef(new Map<string, HTMLLIElement>());
  /** Where the current pointer drag would land if released right now. */
  const dropTargetRef = useRef<{ columnId: string; index: number } | undefined>(undefined);

  const run = useCallback(
    (command: KanbanCommand) => {
      const result = applyKanbanCommands(board, [command]);
      if (result.applied.length === 0) return result.board;
      setBoard(result.board);
      onCommand?.(command);
      return result.board;
    },
    [board, setBoard, onCommand],
  );

  const announceMove = useCallback((next: KanbanBoardData, cardId: string) => {
    const title = next.cards[cardId]?.title ?? 'Card';
    const column = findColumnOfCard(next, cardId);
    if (!column) return;
    const index = column.cardIds.indexOf(cardId);
    setAnnouncement(
      `${title} moved to ${column.title}, position ${index + 1} of ${column.cardIds.length}.`,
    );
  }, []);

  /**
   * Moving a card to another column re-parents its `<li>`, which remounts the
   * element and drops focus to `<body>` — from there the board's key handler
   * never fires again, stranding the user mid-move after a single arrow press.
   * Re-focusing the lifted card after each applied move is what makes a
   * multi-step keyboard move possible at all.
   */
  useEffect(() => {
    if (!lift) return;
    const element = cardRefs.current.get(lift.cardId);
    if (element && document.activeElement !== element) element.focus();
  }, [board, lift]);

  // ---------------------------------------------------------------- pointer

  const resolveDropTarget = useCallback(
    (
      clientX: number,
      clientY: number,
      draggedId: string,
    ): { columnId: string; index: number } | undefined => {
      for (const [columnId, element] of columnRefs.current) {
        const rect = element.getBoundingClientRect();
        const inside =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;
        if (!inside) continue;

        const column = board.columns.find((candidate) => candidate.id === columnId);
        if (!column) return undefined;

        // The dragged card is excluded for two reasons that happen to agree:
        // it now follows the pointer, so its measured rect is wherever the
        // cursor is rather than where it sits in the list; and the reducer's
        // index means "position once the card has left its old slot", which is
        // exactly the index you get by counting the cards that remain.
        const others = column.cardIds.filter((cardId) => cardId !== draggedId);

        // Insert before the first card whose midpoint the pointer has passed —
        // midpoints rather than edges is what makes a drop land where the card
        // visually appears to go.
        let index = others.length;
        for (let i = 0; i < others.length; i += 1) {
          const cardId = others[i];
          if (!cardId) continue;
          const cardElement = cardRefs.current.get(cardId);
          if (!cardElement) continue;
          const cardRect = cardElement.getBoundingClientRect();
          if (clientY < cardRect.top + cardRect.height / 2) {
            index = i;
            break;
          }
        }
        return { columnId, index };
      }
      return undefined;
    },
    [board],
  );

  const drag = usePointerDrag({
    disabled,
    onDragMove: (event, delta) => {
      if (!dragCardId) return;
      // Ignore sub-threshold jitter so a plain click on a card doesn't
      // register as a zero-distance drag.
      if (Math.abs(delta.x) < DRAG_THRESHOLD && Math.abs(delta.y) < DRAG_THRESHOLD) return;
      setDragOffset(delta);
      const target = resolveDropTarget(event.clientX, event.clientY, dragCardId);
      dropTargetRef.current = target;
      setDropTarget(target);
    },
    onDragEnd: () => {
      const target = dropTargetRef.current;
      const cardId = dragCardId;
      dropTargetRef.current = undefined;
      setDragCardId(undefined);
      setDropTarget(undefined);
      setDragOffset(undefined);
      if (!cardId || !target) return;
      const next = run({ op: 'move', cardId, toColumnId: target.columnId, index: target.index });
      announceMove(next, cardId);
    },
  });

  const onCardPointerDown = (event: PointerEvent, cardId: string) => {
    if (disabled) return;
    // A press on the menu button (or any consumer action) is a click, not the
    // start of a drag — otherwise opening the menu drags the card instead.
    if ((event.target as HTMLElement | null)?.closest('[data-kanban-card-actions]')) return;
    setDragCardId(cardId);
    setFocusedCardId(cardId);
    drag.handlers.onPointerDown(event);
  };

  // --------------------------------------------------------------- keyboard

  const moveFocus = useCallback(
    (cardId: string, columnDelta: number, rowDelta: number) => {
      const { columnId, index } = positionOf(board, cardId);
      const columnIndex = board.columns.findIndex((column) => column.id === columnId);
      if (columnIndex === -1) return;

      const targetColumn = board.columns[columnIndex + columnDelta];
      const column = board.columns[columnIndex];
      if (columnDelta !== 0) {
        if (!targetColumn || targetColumn.cardIds.length === 0) return;
        // Keep the reading position when crossing columns rather than
        // snapping to the top — a shorter column clamps to its last card.
        const nextId = targetColumn.cardIds[Math.min(index, targetColumn.cardIds.length - 1)];
        if (nextId) {
          setFocusedCardId(nextId);
          cardRefs.current.get(nextId)?.focus();
        }
        return;
      }

      if (!column) return;
      const nextId = column.cardIds[index + rowDelta];
      if (!nextId) return;
      setFocusedCardId(nextId);
      cardRefs.current.get(nextId)?.focus();
    },
    [board],
  );

  const moveLifted = useCallback(
    (cardId: string, columnDelta: number, rowDelta: number) => {
      const { columnId, index } = positionOf(board, cardId);
      const columnIndex = board.columns.findIndex((column) => column.id === columnId);
      if (columnIndex === -1) return;

      if (columnDelta !== 0) {
        const targetColumn = board.columns[columnIndex + columnDelta];
        if (!targetColumn) return;
        const next = run({
          op: 'move',
          cardId,
          toColumnId: targetColumn.id,
          index: Math.min(index, targetColumn.cardIds.length),
        });
        announceMove(next, cardId);
        return;
      }

      const column = board.columns[columnIndex];
      if (!column) return;
      const nextIndex = index + rowDelta;
      if (nextIndex < 0 || nextIndex >= column.cardIds.length) return;
      const next = run({ op: 'move', cardId, toColumnId: column.id, index: nextIndex });
      announceMove(next, cardId);
    },
    [board, run, announceMove],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Only keys aimed at a card itself. Without this the menu button inside a
    // card would have its Space/arrows stolen by the board's move handling.
    if ((event.target as HTMLElement | null)?.tagName !== 'LI') return;

    const cardId = focusedCardId;
    if (!cardId || !board.cards[cardId]) return;

    const title = board.cards[cardId]?.title ?? 'Card';

    if (event.key === 'Escape' && lift) {
      event.preventDefault();
      const next = run({
        op: 'move',
        cardId: lift.cardId,
        toColumnId: lift.originColumnId,
        index: lift.originIndex,
      });
      setLift(undefined);
      const column = next.columns.find((candidate) => candidate.id === lift.originColumnId);
      setAnnouncement(`Move cancelled. ${title} returned to ${column?.title ?? 'its column'}.`);
      return;
    }

    if (event.key === ' ' || event.key === 'Enter') {
      if (disabled) return;
      event.preventDefault();
      if (lift) {
        setLift(undefined);
        setAnnouncement(`${title} dropped.`);
      } else {
        const { columnId, index } = positionOf(board, cardId);
        setLift({ cardId, originColumnId: columnId, originIndex: index });
        setAnnouncement(
          `${title} picked up. Use the arrow keys to move it, space to drop, escape to cancel.`,
        );
      }
      return;
    }

    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = deltas[event.key];
    if (!delta) return;

    event.preventDefault();
    const [columnDelta, rowDelta] = delta;
    if (lift && !disabled) {
      moveLifted(cardId, columnDelta, rowDelta);
    } else {
      moveFocus(cardId, columnDelta, rowDelta);
    }
  };

  // --------------------------------------------------------------------- AI

  // `useToast` throws outside a provider, so the optional undo reads the
  // context directly — an undo affordance must never be the reason a board
  // can't mount.
  const toastContext = useContext(ToastContext);

  const commands = useKanbanCommands({
    board,
    resolveCommands,
    snapshotOptions,
    onApply: (nextBoard, appliedCommands) => {
      setBoard(nextBoard);
      appliedCommands.forEach((command) => onCommand?.(command));
    },
  });

  const { outcome } = commands;
  const showPrompt = aiPrompt && commands.available;

  /**
   * A single applied change gets an undo affordance, and the announcement is
   * the fallback when no `ToastProvider` is mounted — the change still
   * happened, so it still has to be reported somewhere.
   */
  useEffect(() => {
    if (outcome.kind === 'answer') {
      setHighlightedCardIds(outcome.highlightCardIds);
      setAnnouncement(outcome.message);
      return;
    }

    setHighlightedCardIds([]);

    if (outcome.kind === 'applied') {
      const summary =
        outcome.commands.length === 1
          ? '1 change applied.'
          : `${outcome.commands.length} changes applied.`;
      setAnnouncement(summary);
      toastContext?.toast({
        description: summary,
        variant: 'success',
        action: { label: 'Undo', onClick: commands.undo },
      });
    }

    if (outcome.kind === 'error') setAnnouncement(`Request failed: ${outcome.error}`);
    // `commands.undo` is stable; re-running on every outcome identity is the point.
  }, [outcome, toastContext, commands.undo]);

  // ---------------------------------------------------------------- actions

  /**
   * A third input path alongside drag and keyboard, and the only one that's
   * discoverable: dragging advertises nothing, and on touch it's behind a long
   * press. Each item emits the same command a drag would.
   */
  const cardActionsFor = (card: KanbanCardData): ReactNode => {
    const custom = cardActions?.(card);
    if (!cardMenu) return custom ?? null;

    const source = findColumnOfCard(board, card.id);
    const targets = board.columns.filter((column) => column.id !== source?.id);

    return (
      <>
        {custom}
        <Dropdown>
          <Dropdown.Trigger
            as={IconButton}
            size="sm"
            variant="ghost"
            aria-label={`Actions for ${card.title}`}
            disabled={disabled}
          >
            <MoreIcon />
          </Dropdown.Trigger>
          <Dropdown.Menu placement="bottom-end">
            {targets.map((column) => (
              <Dropdown.Item
                key={column.id}
                onSelect={() => {
                  const next = run({ op: 'move', cardId: card.id, toColumnId: column.id });
                  announceMove(next, card.id);
                }}
              >
                Move to {column.title}
              </Dropdown.Item>
            ))}
            {!hideCardDelete && (
              <Dropdown.Item
                onSelect={() => {
                  run({ op: 'delete', cardId: card.id });
                  setAnnouncement(`${card.title} deleted.`);
                }}
              >
                Delete
              </Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </>
    );
  };

  // ----------------------------------------------------------------- render

  const firstCardId = board.columns.find((column) => column.cardIds.length > 0)?.cardIds[0];
  const tabbableCardId =
    focusedCardId && board.cards[focusedCardId] ? focusedCardId : (firstCardId ?? undefined);

  const grid = (
    // Composite widget: the key handler sits on the container while focus
    // lives on the roving-tabindex cards inside it — the same shape as
    // `Tabs.List`, which only satisfies this rule because `role="tablist"`
    // happens to be on its interactive-role list and `role="group"` isn't.
    // The cards are focusable and keyboard-operable, which is what the rule is
    // actually protecting; `expectNoA11yViolations` covers this component.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      className={mergeClasses(styles.board, !showPrompt && className)}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {board.columns.map((column) => {
        // Indices here count only the cards that stay put, matching how
        // `resolveDropTarget` measures — so the line appears exactly where the
        // card will land rather than one slot off whenever it moves downward
        // within its own column.
        const settled = column.cardIds.filter((cardId) => cardId !== dragCardId);
        const indicatorAt = dropTarget?.columnId === column.id ? dropTarget.index : undefined;

        return (
          <KanbanColumn
            key={column.id}
            column={column}
            active={dropTarget?.columnId === column.id}
            emptyState={emptyColumnState}
            className={styles.column}
            ref={(element) => {
              if (element) columnRefs.current.set(column.id, element);
              else columnRefs.current.delete(column.id);
            }}
          >
            {/* Cards keep their original DOM position, including the dragged
                one — it's moved with a transform, which leaves its slot in the
                layout as a visible gap. Re-ordering the DOM instead would make
                the card jump the moment the drag began. */}
            {column.cardIds.map((cardId) => {
              const card = board.cards[cardId];
              if (!card) return null;
              const isDragging = dragCardId === cardId;
              const showIndicatorHere = indicatorAt === settled.indexOf(cardId) && !isDragging;

              return (
                <Fragment key={cardId}>
                  {showIndicatorHere && <DropIndicator />}
                  <KanbanCard
                    card={card}
                    statusLabels={statusLabels}
                    renderCard={renderCard}
                    dragging={isDragging}
                    lifted={lift?.cardId === cardId}
                    highlighted={highlightedCardIds.includes(cardId)}
                    tabIndex={tabbableCardId === cardId ? 0 : -1}
                    actions={cardActionsFor(card)}
                    {...(isDragging && dragOffset
                      ? {
                          style: {
                            transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
                          },
                        }
                      : {})}
                    onFocus={() => setFocusedCardId(cardId)}
                    onPointerDown={(event) => onCardPointerDown(event, cardId)}
                    onPointerMove={drag.handlers.onPointerMove}
                    onPointerUp={drag.handlers.onPointerUp}
                    onPointerCancel={drag.handlers.onPointerCancel}
                    ref={(element) => {
                      if (element) cardRefs.current.set(cardId, element);
                      else cardRefs.current.delete(cardId);
                    }}
                  />
                </Fragment>
              );
            })}

            {/* Trailing position, and the only indicator an empty column can show. */}
            {indicatorAt !== undefined && indicatorAt >= settled.length && <DropIndicator />}
          </KanbanColumn>
        );
      })}

      {/* The only channel that reports a keyboard move — without it the card
          silently relocates and a screen-reader user loses it. `VisuallyHidden`
          rather than `display: none`, which would remove the live region from
          the a11y tree and announce nothing. */}
      <VisuallyHidden aria-live="polite" role="status">
        {announcement}
      </VisuallyHidden>
    </div>
  );

  // No prompt bar means no wrapper either — the board's markup stays exactly
  // what it is without AI, rather than gaining a stray div that shifts layout
  // for every consumer who never opted in.
  if (!showPrompt) return grid;

  return (
    <div className={mergeClasses(styles.shell, className)}>
      <KanbanPromptBar
        cards={Object.values(board.cards)}
        onSubmit={commands.submit}
        status={commands.status}
        error={outcome.kind === 'error' ? outcome.error : undefined}
        disabled={disabled}
        {...(promptPlaceholder ? { placeholder: promptPlaceholder } : {})}
      />

      {/* A question's answer is shown, not just announced — the whole point of
          the query path is that the user reads it. */}
      {outcome.kind === 'answer' && <p className={styles.answer}>{outcome.message}</p>}

      {outcome.kind === 'staged' && (
        <KanbanChangePreview
          board={board}
          commands={outcome.commands}
          rejected={outcome.rejected}
          {...(outcome.message ? { message: outcome.message } : {})}
          onAccept={commands.acceptStaged}
          onReject={commands.reset}
        />
      )}

      {grid}
    </div>
  );
});

/**
 * Compound: `<KanbanBoard.Column>` / `<KanbanBoard.Card>` are the very same
 * components the board renders internally, re-assigned rather than
 * reimplemented — the `Drawer.Header`-is-`Dialog.Header` precedent. They're
 * there for consumers composing a board by hand; the data-driven `board`
 * prop is the normal path.
 */
export const KanbanBoard = Object.assign(KanbanBoardRoot, {
  Column: KanbanColumn,
  Card: KanbanCard,
  displayName: 'KanbanBoard',
});
