import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ChartAxis.module.css';

export type ChartAxisOrientation = 'left' | 'bottom';

export interface ChartAxisTick {
  /**
   * Offset along the axis in plot units — distance from the plot's top edge
   * for a `left` axis, from its left edge for a `bottom` axis.
   */
  position: number;
  label: string;
}

export interface ChartAxisOwnProps {
  orientation: ChartAxisOrientation;
  ticks: ChartAxisTick[];
  /** Length of the axis line, in plot units. */
  length: number;
  /** Render the tick labels without the axis line. */
  hideLine?: boolean;
}

export type ChartAxisProps = Omit<ComponentPropsWithoutRef<'g'>, 'children'> & ChartAxisOwnProps;

/**
 * One axis of a cartesian plot: the axis line plus its tick labels.
 *
 * Deliberately dumb about scales — the caller converts data into
 * `{ position, label }` pairs, so the same component serves the linear value
 * axis and the categorical band axis without knowing which is which. Position
 * the whole axis with a `transform` on the group; ticks are laid out relative
 * to the plot's own origin.
 *
 * Rendered inside an `aria-hidden` `<svg>`: these labels duplicate what
 * `ChartContainer`'s table twin already exposes, so announcing them again
 * would read every value twice.
 */
export const ChartAxis = forwardRef<SVGGElement, ChartAxisProps>(function ChartAxis(
  { className, orientation, ticks, length, hideLine = false, ...rest },
  ref,
) {
  const vertical = orientation === 'left';

  return (
    <g
      ref={ref}
      className={mergeClasses(styles.axis, className)}
      data-orientation={orientation}
      {...rest}
    >
      {hideLine ? null : (
        <line
          className={styles.line}
          x1={0}
          y1={0}
          x2={vertical ? 0 : length}
          y2={vertical ? length : 0}
        />
      )}
      {ticks.map((tick, index) => (
        <text
          key={`${tick.label}-${index}`}
          className={styles.label}
          x={vertical ? 0 : tick.position}
          y={vertical ? tick.position : 0}
        >
          {tick.label}
        </text>
      ))}
    </g>
  );
});

ChartAxis.displayName = 'ChartAxis';
