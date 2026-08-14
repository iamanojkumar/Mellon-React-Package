import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { isOverWipLimit } from '../../utilities/kanbanReducer';
import type { KanbanColumnData } from '../../utilities/kanbanReducer';
import styles from './KanbanColumn.module.css';

export interface KanbanColumnOwnProps {
  column: KanbanColumnData;
  /** The column's cards — `KanbanCard` elements, supplied by the board. */
  children?: ReactNode;
  /** A card is hovering over this column mid-drag. */
  active?: boolean;
  /** Shown in place of the cards when the column is empty. Defaults to `'No cards'`. */
  emptyState?: ReactNode;
}

export type KanbanColumnProps = Omit<ComponentPropsWithoutRef<'section'>, 'children' | 'id'> &
  KanbanColumnOwnProps;

/**
 * A column's chrome plus its drop region. Like `KanbanCard`, it holds no
 * state — `active` is handed down by the board, which owns hit-testing.
 *
 * The count and any WIP overflow are stated in **text**, not conveyed by the
 * colour change alone: an over-limit column reads "5 of 3" and carries a
 * visible "over limit" note, so the styling is reinforcement rather than the
 * only signal.
 */
export const KanbanColumn = forwardRef<HTMLElement, KanbanColumnProps>(function KanbanColumn(
  { column, children, active = false, emptyState = 'No cards', className, ...rest },
  ref,
) {
  const count = column.cardIds.length;
  const overLimit = isOverWipLimit(column);
  const headingId = `kanban-column-${column.id}`;

  return (
    <section
      ref={ref}
      className={mergeClasses(styles.column, className)}
      aria-labelledby={headingId}
      data-active={active ? '' : undefined}
      data-over-limit={overLimit ? '' : undefined}
      {...rest}
    >
      <header className={styles.header}>
        <h3 id={headingId} className={styles.title}>
          {column.title}
        </h3>
        <span className={styles.count}>
          {column.wipLimit === undefined ? count : `${count} of ${column.wipLimit}`}
        </span>
      </header>

      {overLimit && <p className={styles.overLimit}>Over WIP limit</p>}

      <ul className={styles.list} aria-labelledby={headingId}>
        {children}
      </ul>

      {count === 0 && <p className={styles.empty}>{emptyState}</p>}
    </section>
  );
});

KanbanColumn.displayName = 'KanbanColumn';
