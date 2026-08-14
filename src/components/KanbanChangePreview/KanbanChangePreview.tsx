import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { mergeClasses } from '../../utilities/mergeClasses';
import { findColumnOfCard } from '../../utilities/kanbanReducer';
import type {
  KanbanBoardData,
  KanbanCommand,
  KanbanRejectedCommand,
} from '../../utilities/kanbanReducer';
import styles from './KanbanChangePreview.module.css';

export interface KanbanChangePreviewProps {
  /** The board the commands were validated against — used to name cards and columns. */
  board: KanbanBoardData;
  commands: KanbanCommand[];
  /** Commands dropped in validation, shown with their reasons so nothing disappears silently. */
  rejected?: KanbanRejectedCommand[];
  /** Prose from the model, rendered verbatim. */
  message?: ReactNode;
  onAccept: (commands: KanbanCommand[]) => void;
  onReject: () => void;
  heading?: ReactNode;
  className?: string;
}

function columnTitle(board: KanbanBoardData, columnId: string): string {
  return board.columns.find((column) => column.id === columnId)?.title ?? columnId;
}

function cardTitle(board: KanbanBoardData, cardId: string): string {
  return board.cards[cardId]?.title ?? cardId;
}

/**
 * Plain-language description of one command. Deliberately names the card and
 * column by **title**, not id: the ids exist so the model can be precise, but
 * a human reviewing a batch needs to recognise what's being changed.
 */
export function describeKanbanCommand(board: KanbanBoardData, command: KanbanCommand): string {
  switch (command.op) {
    case 'move': {
      const from = findColumnOfCard(board, command.cardId);
      const to = columnTitle(board, command.toColumnId);
      const title = cardTitle(board, command.cardId);
      return from && from.id === command.toColumnId
        ? `Reorder “${title}” within ${to}`
        : `Move “${title}” to ${to}`;
    }
    case 'create':
      return `Add “${command.card.title}” to ${columnTitle(board, command.columnId)}`;
    case 'update': {
      const fields = Object.keys(command.patch).join(', ');
      return `Update ${fields} on “${cardTitle(board, command.cardId)}”`;
    }
    case 'delete':
      return `Delete “${cardTitle(board, command.cardId)}”`;
  }
}

/**
 * The review step for a batch the board refused to auto-apply — anything
 * touching more than one card, or anything destructive.
 *
 * Every command starts **checked**: the user is confirming a proposal, not
 * assembling one from scratch, and making them re-select forty tidy-up moves
 * would make the feature useless. Unchecking is how you veto a single item,
 * and `applyKanbanCommands` re-validates whatever survives, so an unchecked
 * `create` whose card a later `move` depended on still can't corrupt the
 * board — that move is simply dropped.
 *
 * Presentational: it neither calls an AI client nor mutates the board.
 */
export function KanbanChangePreview({
  board,
  commands,
  rejected = [],
  message,
  onAccept,
  onReject,
  heading = 'Proposed changes',
  className,
}: KanbanChangePreviewProps) {
  const [selected, setSelected] = useState<number[]>(() => commands.map((_, index) => index));

  // A new batch replaces the old selection outright — carrying indices across
  // batches would silently re-check unrelated commands.
  useEffect(() => {
    setSelected(commands.map((_, index) => index));
  }, [commands]);

  const accepted = commands.filter((_, index) => selected.includes(index));

  return (
    <section className={mergeClasses(styles.preview, className)} aria-label="Proposed changes">
      <h3 className={styles.heading}>{heading}</h3>

      {message && <p className={styles.message}>{message}</p>}

      {commands.length > 0 && (
        <ul className={styles.list}>
          {commands.map((command, index) => (
            <li key={`${command.op}-${index}`} className={styles.item}>
              <Checkbox
                checked={selected.includes(index)}
                onCheckedChange={(checked) =>
                  setSelected((previous) =>
                    checked
                      ? [...previous, index]
                      : previous.filter((candidate) => candidate !== index),
                  )
                }
                label={describeKanbanCommand(board, command)}
                data-destructive={command.op === 'delete' ? '' : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <div className={styles.rejected}>
          <p className={styles.rejectedHeading}>
            {rejected.length === 1
              ? '1 change was ignored:'
              : `${rejected.length} changes were ignored:`}
          </p>
          <ul className={styles.rejectedList}>
            {rejected.map((entry, index) => (
              <li key={`${entry.command.op}-${index}`}>{entry.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onReject}>
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAccept(accepted)}
          disabled={accepted.length === 0}
        >
          {accepted.length === commands.length
            ? `Apply ${commands.length === 1 ? 'change' : 'all changes'}`
            : `Apply ${accepted.length} of ${commands.length}`}
        </Button>
      </div>
    </section>
  );
}

KanbanChangePreview.displayName = 'KanbanChangePreview';
