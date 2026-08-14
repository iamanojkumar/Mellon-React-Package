import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ChartTooltip.module.css';

/** Distance from an edge, in percent, at which the box stops being centred. */
const EDGE_THRESHOLD = 15;

export type ChartTooltipAlign = 'start' | 'center' | 'end';

export interface ChartTooltipOwnProps {
  /**
   * Anchor as a percentage of the plot box, 0–100.
   *
   * Percentages rather than pixels on purpose: the plot's SVG scales to its
   * container, so a pixel offset computed at render time would drift as soon
   * as the container resized. A percentage of the same box the SVG fills
   * tracks it exactly, with nothing to measure and no `ResizeObserver`.
   */
  x: number;
  y: number;
  children: ReactNode;
}

export type ChartTooltipProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  ChartTooltipOwnProps;

/**
 * The hover readout for a plot.
 *
 * `aria-hidden`, like the plot it belongs to. The chart's accessible content
 * is `ChartContainer`'s table twin, which already lists every label/value
 * pair — announcing the tooltip as well would read the same numbers twice,
 * and it would announce them on pointer movement, which no keyboard or
 * screen-reader user can trigger anyway.
 *
 * Must be placed inside a positioned element that shares the plot's box;
 * `BarChart` and `LineChart` both provide one.
 */
export const ChartTooltip = forwardRef<HTMLDivElement, ChartTooltipProps>(function ChartTooltip(
  { className, x, y, children, style, ...rest },
  ref,
) {
  const clampedX = Math.min(100, Math.max(0, x));
  const clampedY = Math.min(100, Math.max(0, y));

  // Near an edge the box stops being centred on the anchor, or half of it
  // would sit outside the figure and clip.
  const align: ChartTooltipAlign =
    clampedX < EDGE_THRESHOLD ? 'start' : clampedX > 100 - EDGE_THRESHOLD ? 'end' : 'center';

  return (
    <div
      ref={ref}
      className={mergeClasses(styles.tooltip, className)}
      data-align={align}
      aria-hidden="true"
      style={{ left: `${clampedX}%`, top: `${clampedY}%`, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
});

ChartTooltip.displayName = 'ChartTooltip';
