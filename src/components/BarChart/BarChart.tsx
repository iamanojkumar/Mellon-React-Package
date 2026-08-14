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
import styles from './BarChart.module.css';

export interface BarChartOwnProps extends ChartAIProps {
  /** The series. One bar per datum, in the order given. */
  data: ChartDatum[];
  /** What the chart shows, e.g. "Monthly revenue, in USD". Required — it names the series and labels the table twin. */
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
   * Extend the value axis to include zero. Defaults to `true` and should stay
   * that way for bars: a clipped baseline exaggerates differences, which is
   * the most common way a bar chart misleads.
   */
  includeZero?: boolean;
  /** Fraction of each category slot left as gutter, 0–1. Defaults to 0.2. */
  bandPadding?: number;
  /** Draw reference lines at the value ticks. Defaults to `true`. */
  showGrid?: boolean;
  /** Show a hover readout over the bar under the pointer. Defaults to `true`. */
  showTooltip?: boolean;
  /**
   * Print each value above its bar. Defaults to `false` — labels don't
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

export type BarChartProps = Omit<ComponentPropsWithoutRef<'figure'>, 'children'> & BarChartOwnProps;

/**
 * Single-series bar chart.
 *
 * Single-series is a constraint, not a simplification: telling two series
 * apart needs a categorical palette, and this system deliberately ships none
 * until the Foundation defines the roles per theme
 * (docs/CHART_TOKEN_REQUIREMENTS.md §A). One series needs no palette — the
 * caption names it, so the accent hue is both correct and sufficient.
 *
 * The SVG is `aria-hidden`; `ChartContainer` supplies the real accessible
 * content as a `<table>`. Values that aren't finite are skipped by the plot
 * but still appear in that table, so bad data shows up rather than silently
 * vanishing.
 */
export const BarChart = forwardRef<HTMLElement, BarChartProps>(function BarChart(
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
  const { linear, band, toY, baselineY } = useChartScale({
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

  // With negative values the bars grow from a zero line that sits above the
  // axis. Category labels stay at the bottom regardless — pinning them to the
  // zero line would drop them on top of the downward bars.
  const hasNegativeBaseline = Math.abs(baselineY - innerHeight) > 0.5;

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
              <ChartGrid positions={valueTicks.map((t) => t.position)} length={innerWidth} />
            ) : null}

            {/* No crosshair here, unlike LineChart: a bar already spans the
                full distance from the baseline to its value, so a vertical
                rule adds ink without adding a reading. Outlining the bar
                itself says the same thing more quietly. */}
            {data.map((datum, index) => {
              if (!Number.isFinite(datum.value)) return null;
              const valueY = toY(datum.value);
              return (
                <rect
                  key={`${datum.label}-${index}`}
                  className={styles.bar}
                  data-active={index === activeIndex ? '' : undefined}
                  x={band.position(index)}
                  y={Math.min(valueY, baselineY)}
                  width={band.bandWidth}
                  height={Math.abs(valueY - baselineY)}
                />
              );
            })}

            {hasNegativeBaseline ? (
              <line
                className={styles.zeroLine}
                x1={0}
                y1={baselineY}
                x2={innerWidth}
                y2={baselineY}
              />
            ) : null}

            {showDataLabels
              ? data.map((datum, index) => {
                  if (!Number.isFinite(datum.value)) return null;
                  const valueY = toY(datum.value);
                  const below = valueY > baselineY;
                  return (
                    <ChartDataLabel
                      key={`label-${datum.label}-${index}`}
                      x={band.center(index)}
                      y={below ? Math.max(valueY, baselineY) : Math.min(valueY, baselineY)}
                      placement={below ? 'below' : 'above'}
                    >
                      {formatValue(datum.value)}
                    </ChartDataLabel>
                  );
                })
              : null}

            {/* Transparent hit areas span the whole slot, gutter included, so
                the pointer never falls into a dead gap between two bars. */}
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
            y={((margin.top + Math.min(toY(activeDatum!.value), baselineY)) / height) * 100}
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

BarChart.displayName = 'BarChart';
