import { forwardRef } from 'react';
import { BarChart } from '../BarChart';
import { LineChart } from '../LineChart';
import type { BarChartProps } from '../BarChart';
import type { ChartDatum } from '../ChartContainer';

export type ChartSurfaceType = 'bar' | 'line';

/** @deprecated Use `ChartDatum`, which this is now an alias of. */
export type ChartDataPoint = ChartDatum;

export interface ChartSurfaceOwnProps {
  /** Which plot to render. Defaults to `bar`. */
  type?: ChartSurfaceType;
  data: ChartDataPoint[];
  /** What the chart shows, e.g. "Monthly revenue, in USD". */
  label: string;
  /**
   * Plot height in viewBox units. Defaults to 200, a chat-bubble-sized plot
   * against the charts' own 480-unit width.
   */
  height?: number;
}

export type ChartSurfaceProps = Omit<BarChartProps, 'data' | 'label' | 'height'> &
  ChartSurfaceOwnProps;

/**
 * A chart chosen by a `type` string rather than by importing the component —
 * for call sites that don't know which plot they need until runtime, which is
 * the shape an AI chat response arrives in.
 *
 * A thin preset over `BarChart`/`LineChart`, the same "generate a preset,
 * don't reimplement" shape as `PinInput`-on-`OTPInput`. It used to be a
 * parallel hand-rolled implementation with its own scale math and its own
 * copy of the accessible-table pattern; everything real now lives in the two
 * charts, so a fix to axis rounding or the table twin reaches this too
 * instead of drifting apart from it.
 *
 * `height` is placed *before* the prop spread so a consumer's own value still
 * wins. Nothing is fixed after the spread — unlike `PinInput`'s `mask`, no
 * prop here is the reason to reach for this component; `type` is.
 */
export const ChartSurface = forwardRef<HTMLElement, ChartSurfaceProps>(function ChartSurface(
  { type = 'bar', height = 200, ...props },
  ref,
) {
  const Chart = type === 'line' ? LineChart : BarChart;
  return <Chart ref={ref} height={height} {...props} />;
});

ChartSurface.displayName = 'ChartSurface';
