import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { CanvasTone } from '../../utilities/canvasReducer';
import styles from './CanvasFrame.module.css';

export interface CanvasFrameOwnProps {
  title: string;
  tone?: CanvasTone;
  /** Rarely used — a frame's members are ordinary blocks positioned over it, not children. */
  children?: ReactNode;
}

export type CanvasFrameProps = Omit<ComponentPropsWithoutRef<'div'>, 'title' | 'children'> &
  CanvasFrameOwnProps;

/**
 * A named bounded region — the target `aiCluster` groups notes into.
 *
 * Frames do **not** own their members as React children. Membership is
 * geometric: a block inside the frame's rect belongs to it. That keeps the
 * scene a flat list, so moving a block between frames is an ordinary `move`
 * command rather than a re-parenting operation, and one block can't be lost
 * inside a collapsed subtree.
 *
 * Rendered behind everything else by the canvas, since it's a backdrop.
 */
export const CanvasFrame = forwardRef<HTMLDivElement, CanvasFrameProps>(function CanvasFrame(
  { title, tone = 'neutral', children, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={mergeClasses(styles.frame, className)}
      data-tone={tone}
      role="group"
      aria-label={title}
      {...rest}
    >
      <span className={styles.title}>{title}</span>
      {children}
    </div>
  );
});

CanvasFrame.displayName = 'CanvasFrame';
