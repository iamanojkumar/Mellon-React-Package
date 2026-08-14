import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ChartDataLabel.module.css';

export type ChartDataLabelPlacement = 'above' | 'below';

export interface ChartDataLabelOwnProps {
  /** Anchor point in plot units — normally the mark's own centre and edge. */
  x: number;
  y: number;
  /**
   * Which side of the anchor the label sits on. `below` is for marks that
   * hang under the baseline, so the label clears the mark either way.
   */
  placement?: ChartDataLabelPlacement;
  children: ReactNode;
}

export type ChartDataLabelProps = Omit<ComponentPropsWithoutRef<'text'>, 'x' | 'y' | 'children'> &
  ChartDataLabelOwnProps;

/**
 * A value printed next to its mark, for charts where the reader needs the
 * number rather than the shape.
 *
 * **Only sits outside the mark, never on it.** An in-bar label needs a colour
 * guaranteed legible against the fill behind it — the `-on` roles in
 * docs/CHART_TOKEN_REQUIREMENTS.md §A, which the Foundation has not shipped.
 * Picking one here would be inventing a contrast guarantee this file can't
 * make, so the inside placement is deliberately absent rather than
 * approximated.
 *
 * Labels don't self-avoid: at high category counts they will collide, which
 * is why the charts leave them off by default.
 */
export const ChartDataLabel = forwardRef<SVGTextElement, ChartDataLabelProps>(
  function ChartDataLabel({ className, x, y, placement = 'above', children, ...rest }, ref) {
    return (
      <text
        ref={ref}
        className={mergeClasses(styles.label, className)}
        data-placement={placement}
        x={x}
        y={y}
        {...rest}
      >
        {children}
      </text>
    );
  },
);

ChartDataLabel.displayName = 'ChartDataLabel';
