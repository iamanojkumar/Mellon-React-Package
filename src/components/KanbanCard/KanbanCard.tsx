import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Card } from '../Card/Card';
import { Badge } from '../Badge/Badge';
import { Tag } from '../Tag/Tag';
import { Avatar } from '../Avatar/Avatar';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { KanbanCard as KanbanCardData, KanbanCardStatus } from '../../utilities/kanbanReducer';
import styles from './KanbanCard.module.css';

export type KanbanStatusLabels = Record<KanbanCardStatus, string>;

/**
 * The status word is rendered *visibly*, which is why the badge suppresses
 * its own icon: `Badge`'s `icon={false}` escape hatch exists precisely for
 * "the visible text already names the status" (see CLAUDE.md). A bare
 * coloured dot would leave hue as the sole carrier of meaning.
 */
export const DEFAULT_KANBAN_STATUS_LABELS: KanbanStatusLabels = {
  success: 'On track',
  warning: 'At risk',
  danger: 'Blocked',
};

export interface KanbanCardOwnProps {
  card: KanbanCardData;
  /** Mid-pointer-drag. Presentational only — the board owns the drag state. */
  dragging?: boolean;
  /** Picked up by keyboard and awaiting a drop. Distinct from `dragging`: there's no pointer following it, so it needs its own affordance. */
  lifted?: boolean;
  /**
   * Called out as part of an answer to a question ("what's blocked?"). Purely
   * an annotation — a highlighted card has not been changed in any way.
   */
  highlighted?: boolean;
  statusLabels?: KanbanStatusLabels;
  /** Replaces the whole card face. The board still owns the element, its focus behaviour and its drag handlers. */
  renderCard?: (card: KanbanCardData) => ReactNode;
  /**
   * Controls rendered in the card's top-right corner. Marked so the board can
   * tell a press on an action from the start of a drag.
   */
  actions?: ReactNode;
}

export type KanbanCardProps = Omit<ComponentPropsWithoutRef<'li'>, 'id' | 'children'> &
  KanbanCardOwnProps;

/**
 * One card's visual face. Deliberately dumb: it holds no drag, focus or
 * selection state of its own — `KanbanBoard` owns all of that and passes the
 * result down as flags, the same split that keeps `ChartAxis` ignorant of
 * scales.
 *
 * Renders as an `<li>` because a column is a real list; the board makes it
 * focusable by managing `tabIndex` for roving focus.
 */
export const KanbanCard = forwardRef<HTMLLIElement, KanbanCardProps>(function KanbanCard(
  {
    card,
    dragging = false,
    lifted = false,
    highlighted = false,
    statusLabels = DEFAULT_KANBAN_STATUS_LABELS,
    renderCard,
    actions,
    className,
    ...rest
  },
  ref,
) {
  return (
    <Card
      as="li"
      ref={ref}
      variant="outlined"
      padding="sm"
      className={mergeClasses(styles.card, className)}
      // Tells assistive tech the item can be moved, which nothing else in the
      // markup conveys — a plain list item gives no hint that Space picks it up.
      aria-roledescription="Draggable card"
      data-dragging={dragging ? '' : undefined}
      data-lifted={lifted ? '' : undefined}
      data-highlighted={highlighted ? '' : undefined}
      {...rest}
    >
      {/* The ring alone would make the highlight visual-only, and a screen
          reader would have no idea why this card is part of the answer. */}
      {highlighted && <VisuallyHidden>Referenced in the answer</VisuallyHidden>}

      {/* Positioned rather than inline so a custom `renderCard` face keeps its
          actions without having to lay them out itself. */}
      {actions && (
        <span
          className={styles.actions}
          data-kanban-card-actions=""
          // Stops a press on an action bubbling into the card's drag handlers,
          // so opening the menu doesn't drag the card out from under it.
          onPointerDown={(event) => event.stopPropagation()}
        >
          {actions}
        </span>
      )}

      {renderCard ? (
        renderCard(card)
      ) : (
        <>
          <span className={styles.title}>{card.title}</span>

          {card.description && <span className={styles.description}>{card.description}</span>}

          {(card.status || card.tags?.length || card.assignee) && (
            <span className={styles.footer}>
              {card.status && (
                <Badge color={card.status} icon={false}>
                  {statusLabels[card.status]}
                </Badge>
              )}

              {card.tags?.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}

              {card.assignee && (
                <span className={styles.assignee}>
                  <Avatar size="sm" name={card.assignee.name} src={card.assignee.avatarSrc} />
                </span>
              )}
            </span>
          )}
        </>
      )}
    </Card>
  );
});

KanbanCard.displayName = 'KanbanCard';
