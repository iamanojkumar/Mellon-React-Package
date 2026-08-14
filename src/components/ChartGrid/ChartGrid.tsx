import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ChartGrid.module.css';

export type ChartGridOrientation = 'horizontal' | 'vertical';

export interface ChartGridOwnProps {
  /**
   * Offsets in plot units, measured perpendicular to the lines: y offsets for
   * `horizontal`, x offsets for `vertical`. Normally the tick positions of
   * whichever axis the grid belongs to, so grid and labels stay aligned.
   */
  positions: number[];
  /** Length of each line, in plot units. */
  length: number;
  orientation?: ChartGridOrientation;
}

export type ChartGridProps = Omit<ComponentPropsWithoutRef<'g'>, 'children'> & ChartGridOwnProps;

/**
 * Reference lines behind the marks.
 *
 * Drawn hairline-thin on purpose: the grid has to stay more recessive than
 * any real border or it competes with the data it's meant to support. The
 * colour is still an interim mapping — `--ds-chart-grid` currently rides on
 * `border-primary` because the Foundation ships no data-viz role that is
 * *fainter* than a border yet (docs/CHART_TOKEN_REQUIREMENTS.md §E), so the
 * weight is doing work the colour can't do until that lands.
 */
export const ChartGrid = forwardRef<SVGGElement, ChartGridProps>(function ChartGrid(
  { className, positions, length, orientation = 'horizontal', ...rest },
  ref,
) {
  const horizontal = orientation === 'horizontal';

  return (
    <g
      ref={ref}
      className={mergeClasses(styles.grid, className)}
      data-orientation={orientation}
      {...rest}
    >
      {positions.map((position, index) => (
        <line
          key={`${position}-${index}`}
          className={styles.line}
          x1={horizontal ? 0 : position}
          y1={horizontal ? position : 0}
          x2={horizontal ? length : position}
          y2={horizontal ? position : length}
        />
      ))}
    </g>
  );
});

ChartGrid.displayName = 'ChartGrid';
