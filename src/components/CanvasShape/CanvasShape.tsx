import { forwardRef, useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import type { CanvasShapeKind, CanvasTone } from '../../utilities/canvasReducer';
import styles from './CanvasShape.module.css';

export interface CanvasShapeOwnProps {
  shape?: CanvasShapeKind;
  /** Label drawn inside the shape. */
  text?: string;
  tone?: CanvasTone;
  /**
   * An arbitrary hex fill from the shape's own color picker — user content,
   * applied as an inline style, not a design token. Layers over `tone`'s
   * border-colour accent rather than replacing it.
   */
  color?: string;
  /** Swaps the label for a borderless, centred input and focuses it. */
  editing?: boolean;
  onTextChange?: (text: string) => void;
  /** Called when the input is dismissed — blur, Escape, or Enter. */
  onEditingEnd?: () => void;
  /** Accessible name for the input while editing. Defaults to `'Shape label'`. */
  editLabel?: string;
}

export type CanvasShapeProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  CanvasShapeOwnProps;

/**
 * The flowchart vocabulary — rectangle, ellipse, diamond, triangle,
 * parallelogram.
 *
 * Drawn with `clip-path` on a plain element rather than as SVG, so the label
 * inside is real, selectable, translatable text that wraps and inherits type
 * tokens. An SVG `<text>` would need manual line breaking and wouldn't reflow.
 *
 * The shape itself is decorative: `aria-hidden` would hide the label too, so
 * instead the geometry carries no semantics and the text is the content. A
 * diamond meaning "decision" is a diagramming convention, not something a
 * screen reader can infer — say it in the text.
 */
export const CanvasShape = forwardRef<HTMLDivElement, CanvasShapeProps>(function CanvasShape(
  {
    shape = 'rectangle',
    text,
    tone = 'neutral',
    color,
    editing = false,
    onTextChange,
    onEditingEnd,
    editLabel = 'Shape label',
    className,
    style,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      className={mergeClasses(styles.shape, className)}
      style={{ ...(color ? { backgroundColor: color } : {}), ...style }}
      data-shape={shape}
      data-tone={tone}
      {...rest}
    >
      {editing ? (
        <input
          ref={inputRef}
          className={styles.input}
          value={text ?? ''}
          aria-label={editLabel}
          onChange={(event) => onTextChange?.(event.target.value)}
          onBlur={() => onEditingEnd?.()}
          onKeyDown={(event) => {
            // Enter and Escape both dismiss — a shape's label is a single
            // short line, unlike a sticky note's multi-line text, so Enter
            // has no "new line" meaning to preserve here.
            if (event.key === 'Escape' || event.key === 'Enter') {
              event.preventDefault();
              onEditingEnd?.();
            }
            // Stays inside the input rather than reaching the canvas, where
            // arrows would move the shape instead of the caret.
            event.stopPropagation();
          }}
        />
      ) : (
        text && <span className={styles.label}>{text}</span>
      )}
    </div>
  );
});

CanvasShape.displayName = 'CanvasShape';
