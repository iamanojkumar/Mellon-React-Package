import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { CanvasChecklistItem } from '../../utilities/canvasReducer';
import styles from './CanvasChecklist.module.css';

export interface CanvasChecklistOwnProps {
  items: CanvasChecklistItem[];
  title?: string;
  /** Omit to render a read-only list — the boxes are then disabled, not fake. */
  onItemToggle?: (id: string, done: boolean) => void;
  /** Accessible name when there's no visible title. Defaults to `'Checklist'`. */
  label?: string;
}

export type CanvasChecklistProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'onChange' | 'title'
> &
  CanvasChecklistOwnProps;

/**
 * A tickable list of tasks, sized to whatever block holds it.
 *
 * The one block face in the catalogue with state of its own to change, which
 * is why it's a component rather than delegation like `code` or `table`. It
 * still owns none of that state: a toggle is reported up and comes back as an
 * `update` command through the reducer, so ticking a box on the canvas and a
 * model ticking it off the same list travel the identical path.
 *
 * A group rather than a list of bare checkboxes — a screen reader needs to know
 * where the checklist ends, and the count belongs to the whole thing.
 */
export const CanvasChecklist = forwardRef<HTMLDivElement, CanvasChecklistProps>(
  function CanvasChecklist({ items, title, onItemToggle, label, className, ...rest }, ref) {
    const done = items.filter((item) => item.done).length;
    const name = title || label || 'Checklist';

    return (
      <div
        ref={ref}
        className={mergeClasses(styles.checklist, className)}
        role="group"
        aria-label={`${name}, ${done} of ${items.length} done`}
        {...rest}
      >
        {title && <p className={styles.title}>{title}</p>}

        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.item}>
              <Checkbox
                checked={item.done ?? false}
                disabled={!onItemToggle}
                onCheckedChange={(checked) => onItemToggle?.(item.id, checked)}
                label={<span className={styles.text}>{item.text}</span>}
                // The block behind would otherwise start a drag from the press
                // that was meant to tick the box.
                onPointerDown={(event) => event.stopPropagation()}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  },
);

CanvasChecklist.displayName = 'CanvasChecklist';
