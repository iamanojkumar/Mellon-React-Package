import { forwardRef, useMemo, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { useChartScale, resolveChartFrame } from '../../hooks/useChartScale';
import type { ChartMargin } from '../../hooks/useChartScale';
import { ChartAxis } from '../ChartAxis';
import type { ChartAxisTick } from '../ChartAxis';
import { ChartGrid } from '../ChartGrid';
import { ChartDataLabel } from '../ChartDataLabel';
import { ChartTooltip } from '../ChartTooltip';
import { ChartContainer } from '../ChartContainer';
import type { ChartDatum, ChartAIProps } from '../ChartContainer';
import styles from './LineChart.module.css';

/**
 * Half of `--ds-chart-marker-size` (8px), the minimum accessible marker size.
 * Set as an attribute rather than through the CSS `r` geometry property
 * because that property's fallback is `0` — an unsupported token would erase
 * every marker, where an unsupported `rx` merely squares a corner.
 */
const MARKER_RADIUS = 4;

export interface LineChartOwnProps extends ChartAIProps {
  /** The series. One point per datum, in the order given. */
  data: ChartDatum[];
  /** What the chart shows, e.g. "Weekly sign-ups". Required — it names the series and labels the table twin. */
  label: string;
  /** Longer explanatory text below the caption. */
  description?: ReactNode;
  /**
   * The viewBox coordinate space, not a pixel size. The plot scales to its
   * container as a unit, so these set the aspect ratio and the proportion
   * between stroke weight and label size — not how big the chart renders.
   */
  width?: number;
  height?: number;
  /** Overrides for the plot gutters, in viewBox units. Widen `left` for long value labels. */
  margin?: Partial<ChartMargin>;
  /** Approximate number of value-axis ticks; nice-rounding may return a few more or fewer. */
  tickCount?: number;
  /**
   * Extend the value axis to include zero. Defaults to `true`. Unlike bars, a
   * line encodes change by slope rather than by area from the baseline, so
   * setting this `false` to zoom into a narrow range is legitimate here —
   * just label it, since it still steepens every slope on screen.
   */
  includeZero?: boolean;
  /** Fraction of each category slot left as gutter, 0–1. Defaults to 0.2. */
  bandPadding?: number;
  /** Draw reference lines at the value ticks. Defaults to `true`. */
  showGrid?: boolean;
  /** Draw a dot at each point. Defaults to `true`. */
  showMarkers?: boolean;
  /** Show a hover readout over the point under the pointer. Defaults to `true`. */
  showTooltip?: boolean;
  /**
   * Print each value above its point. Defaults to `false` — labels don't
   * self-avoid, so they collide once there are many categories.
   */
  showDataLabels?: boolean;
  /** Replaces the tooltip's default `label — value` body. */
  renderTooltip?: (datum: ChartDatum, index: number) => ReactNode;
  /** Formats values for both the axis labels and the table twin. Defaults to `String`. */
  formatValue?: (value: number) => string;
  /** Column heading for the label column in the table twin. */
  categoryHeading?: string;
  /** Column heading for the value column in the table twin. */
  valueHeading?: string;
  /** Render a visible toggle that swaps the plot for its table. */
  tableToggle?: boolean;
}

export type LineChartProps = Omit<ComponentPropsWithoutRef<'figure'>, 'children'> &
  LineChartOwnProps;

/**
 * Single-series line chart.
 *
 * Single-series is a constraint, not a simplification — see `BarChart` and
 * docs/CHART_TOKEN_REQUIREMENTS.md §A for why no second series can be drawn
 * until the Foundation ships a categorical palette.
 *
 * A gap in the data draws as a gap: non-finite values split the line into
 * separate segments rather than being bridged, because interpolating across a
 * missing month invents a reading that was never taken. Those values still
 * appear in `ChartContainer`'s table twin.
 */
export const LineChart = forwardRef<HTMLElement, LineChartProps>(function LineChart(
  {
    className,
    data,
    label,
    description,
    width = 480,
    height = 240,
    margin: marginProp,
    tickCount,
    includeZero,
    bandPadding,
    showGrid = true,
    showMarkers = true,
    showTooltip = true,
    showDataLabels = false,
    renderTooltip,
    formatValue = String,
    categoryHeading,
    valueHeading,
    tableToggle,
    ...rest
  },
  ref,
) {
  const { margin, innerWidth, innerHeight } = resolveChartFrame(width, height, marginProp);

  // useChartScale memoizes on `values` by reference, so it has to be stable.
  const values = useMemo(() => data.map((datum) => datum.value), [data]);
  const { linear, band, toY } = useChartScale({
    values,
    width: innerWidth,
    height: innerHeight,
    tickCount,
    includeZero,
    bandPadding,
  });

  const valueTicks: ChartAxisTick[] = linear.ticks.map((tick) => ({
    position: toY(tick),
    label: formatValue(tick),
  }));

  const categoryTicks: ChartAxisTick[] = data.map((datum, index) => ({
    position: band.center(index),
    label: datum.label,
  }));

  // Runs of consecutive finite points. Each run becomes its own polyline, so
  // a missing value leaves a visible break instead of a straight line drawn
  // through data that doesn't exist.
  const segments = useMemo(() => {
    const runs: Array<Array<{ x: number; y: number }>> = [];
    let current: Array<{ x: number; y: number }> = [];

    data.forEach((datum, index) => {
      if (Number.isFinite(datum.value)) {
        current.push({ x: band.center(index), y: toY(datum.value) });
      } else if (current.length > 0) {
        runs.push(current);
        current = [];
      }
    });
    if (current.length > 0) runs.push(current);

    return runs;
  }, [data, band, toY]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeDatum = activeIndex === null ? undefined : data[activeIndex];
  const showActive = showTooltip && activeDatum !== undefined && Number.isFinite(activeDatum.value);

  return (
    <ChartContainer
      ref={ref}
      className={className}
      label={label}
      description={description}
      data={data}
      formatValue={formatValue}
      categoryHeading={categoryHeading}
      valueHeading={valueHeading}
      tableToggle={tableToggle}
      {...rest}
    >
      <div
        className={styles.plot}
        onPointerLeave={showTooltip ? () => setActiveIndex(null) : undefined}
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {showGrid ? (
              <ChartGrid positions={valueTicks.map((tick) => tick.position)} length={innerWidth} />
            ) : null}

            {showActive ? (
              <line
                className={styles.crosshair}
                x1={band.center(activeIndex as number)}
                y1={0}
                x2={band.center(activeIndex as number)}
                y2={innerHeight}
              />
            ) : null}

            {segments.map((points, index) =>
              points.length > 1 ? (
                <polyline
                  key={`segment-${index}`}
                  className={styles.line}
                  points={points.map((point) => `${point.x},${point.y}`).join(' ')}
                />
              ) : null,
            )}

            {showMarkers
              ? segments.flatMap((points, segmentIndex) =>
                  points.map((point, pointIndex) => (
                    <circle
                      key={`marker-${segmentIndex}-${pointIndex}`}
                      className={styles.marker}
                      cx={point.x}
                      cy={point.y}
                      r={MARKER_RADIUS}
                    />
                  )),
                )
              : null}

            {showDataLabels
              ? data.map((datum, index) =>
                  Number.isFinite(datum.value) ? (
                    <ChartDataLabel
                      key={`label-${datum.label}-${index}`}
                      x={band.center(index)}
                      y={toY(datum.value) - MARKER_RADIUS}
                    >
                      {formatValue(datum.value)}
                    </ChartDataLabel>
                  ) : null,
                )
              : null}

            {/* Transparent hit areas span the whole slot, so the pointer picks
                the nearest point rather than needing to land on the marker. */}
            {showTooltip
              ? data.map((datum, index) => (
                  <rect
                    key={`hit-${datum.label}-${index}`}
                    className={styles.hitArea}

                    data-hit-area=""
                    x={index * band.slotWidth}
                    y={0}
                    width={band.slotWidth}
                    height={innerHeight}
                    onPointerMove={() => setActiveIndex(index)}
                  />
                ))
              : null}
          </g>

          <ChartAxis
            orientation="left"
            ticks={valueTicks}
            length={innerHeight}
            transform={`translate(${margin.left}, ${margin.top})`}
          />
          <ChartAxis
            orientation="bottom"
            ticks={categoryTicks}
            length={innerWidth}
            transform={`translate(${margin.left}, ${margin.top + innerHeight})`}
          />
        </svg>

        {showActive ? (
          <ChartTooltip
            x={((margin.left + band.center(activeIndex as number)) / width) * 100}
            // Lifted by the marker's own radius, so the readout clears the
            // dot it describes instead of resting on it.
            y={((margin.top + toY(activeDatum!.value) - MARKER_RADIUS) / height) * 100}
          >
            {renderTooltip ? (
              renderTooltip(activeDatum!, activeIndex as number)
            ) : (
              <>
                {activeDatum!.label} — {formatValue(activeDatum!.value)}
              </>
            )}
          </ChartTooltip>
        ) : null}
      </div>
    </ChartContainer>
  );
});

LineChart.displayName = 'LineChart';
