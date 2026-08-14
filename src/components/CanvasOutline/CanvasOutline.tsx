import { mergeClasses } from '../../utilities/mergeClasses';
import { buildCanvasOutline } from '../../utilities/canvasGeometry';
import type { CanvasScene } from '../../utilities/canvasReducer';
import styles from './CanvasOutline.module.css';

export interface CanvasOutlineProps {
  scene: CanvasScene;
  /** Shown instead of the visually-hidden default. */
  visible?: boolean;
  /** Accessible name for the list. Defaults to `'Canvas contents'`. */
  label?: string;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  /** Vertical slack, in canvas units, within which blocks count as one row. */
  rowTolerance?: number;
  className?: string;
}

/**
 * A linear navigation aid over a spatial layout.
 *
 * The blocks themselves stay in the accessibility tree — they hold real text
 * and real controls, so hiding them behind a twin would strand focusable
 * elements inside an `aria-hidden` subtree. What a screen reader *can't*
 * perceive is arrangement: which blocks are near each other, what reading
 * order they imply, and which ones are connected. That's what this supplies.
 *
 * Order is reading order (top-to-bottom, then left-to-right, with a row
 * tolerance), and each entry names the blocks it points at — which is the only
 * place the connector graph is stated in words, since the SVG that draws it is
 * `aria-hidden` geometry.
 *
 * Always rendered. `visible` turns it into a side panel rather than mounting
 * it, so a sighted user toggling it doesn't change what assistive tech sees.
 */
export function CanvasOutline({
  scene,
  visible = false,
  label = 'Canvas contents',
  selectedIds = [],
  onSelect,
  rowTolerance,
  className,
}: CanvasOutlineProps) {
  const entries = buildCanvasOutline(scene, rowTolerance);

  return (
    <nav
      aria-label={label}
      className={mergeClasses(visible ? styles.panel : styles.hidden, className)}
    >
      {entries.length === 0 ? (
        <p className={styles.empty}>The canvas is empty.</p>
      ) : (
        <ol className={styles.list}>
          {entries.map((entry) => {
            const selected = selectedIds.includes(entry.block.id);
            return (
              <li key={entry.block.id} className={styles.item}>
                <button
                  type="button"
                  className={styles.entry}
                  data-selected={selected ? '' : undefined}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect?.(entry.block.id)}
                >
                  <span className={styles.kind}>{entry.block.kind}</span>
                  <span className={styles.label}>{entry.label}</span>
                  {entry.connectsTo.length > 0 && (
                    <span className={styles.connections}>
                      {`Connects to ${entry.connectsTo.join(', ')}`}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </nav>
  );
}

CanvasOutline.displayName = 'CanvasOutline';
