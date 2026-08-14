import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { CanvasShapeKind, CanvasTone } from '../../utilities/canvasReducer';
import styles from './CanvasShape.module.css';

export interface CanvasShapeOwnProps {
  shape?: CanvasShapeKind;
  /** Label drawn inside the shape. */
  text?: string;
  tone?: CanvasTone;
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
  { shape = 'rectangle', text, tone = 'neutral', className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClasses(styles.shape, className)}
      data-shape={shape}
      data-tone={tone}
      {...rest}
    >
      {text && <span className={styles.label}>{text}</span>}
    </div>
  );
});

CanvasShape.displayName = 'CanvasShape';
