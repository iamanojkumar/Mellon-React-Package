import { useMemo } from 'react';

/**
 * Scale math for the chart components. Hand-rolled rather than pulling in
 * d3-scale — the same "no charting library" precedent `ChartSurface` set and
 * `AlertVariantIcon` set for icons. The whole surface is ~100 lines of
 * arithmetic; a dependency would cost more than it saves.
 */

export interface LinearScale {
  /** Maps a data value onto a pixel offset within `[0, size]`. */
  scale: (value: number) => number;
  /** The (possibly nice-rounded) domain actually used. */
  domain: [number, number];
  /** Tick values across the domain, including both endpoints. */
  ticks: number[];
}

export interface BandScale {
  /** Left/top edge of the slot at `index`. */
  position: (index: number) => number;
  /** Width of one band, after `padding` is removed. */
  bandWidth: number;
  /**
   * Width of a whole slot, gutter included. This is the hit area a pointer
   * should map to — `bandWidth` would leave the gutters dead, so a hover
   * between two bars would dismiss the tooltip instead of picking a side.
   */
  slotWidth: number;
  /** Center of the slot at `index` — where a line/dot mark sits. */
  center: (index: number) => number;
}

/**
 * Rounds a raw span up to a "nice" number (1, 2, 5, or 10 × a power of ten)
 * so ticks land on readable values instead of 3.7142.
 */
function niceNum(range: number, round: boolean): number {
  if (range === 0 || !Number.isFinite(range)) return 0;
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / 10 ** exponent;

  let niceFraction: number;
  if (round) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * 10 ** exponent;
}

export interface LinearScaleOptions {
  /** Raw data extent. */
  min: number;
  max: number;
  /** Pixel length the domain maps onto. */
  size: number;
  /** Approximate tick count — the nice-rounding may return a few more or fewer. */
  tickCount?: number;
  /**
   * Extend the domain to include zero. Defaults to `true`: a bar chart whose
   * baseline isn't zero exaggerates differences, which is the most common way
   * a chart misleads.
   */
  includeZero?: boolean;
}

export function createLinearScale({
  min,
  max,
  size,
  tickCount = 5,
  includeZero = true,
}: LinearScaleOptions): LinearScale {
  let lo = includeZero ? Math.min(0, min) : min;
  let hi = includeZero ? Math.max(0, max) : max;

  // A flat series (every value identical) has no extent to divide by. Give it
  // an arbitrary unit span so marks land somewhere sensible instead of NaN.
  if (lo === hi) {
    if (lo === 0) {
      hi = 1;
    } else {
      lo = Math.min(0, lo);
      hi = Math.max(0, hi);
      if (lo === hi) hi = lo + 1;
    }
  }

  const step = niceNum((hi - lo) / Math.max(1, tickCount - 1), true);
  const niceLo = step > 0 ? Math.floor(lo / step) * step : lo;
  const niceHi = step > 0 ? Math.ceil(hi / step) * step : hi;
  const span = niceHi - niceLo || 1;

  const ticks: number[] = [];
  if (step > 0) {
    // Accumulate with an epsilon so float drift doesn't drop the last tick.
    for (let value = niceLo; value <= niceHi + step * 1e-6; value += step) {
      // Re-round: repeated addition of e.g. 0.1 accumulates visible error.
      ticks.push(Number((Math.round(value / step) * step).toPrecision(12)));
    }
  } else {
    ticks.push(niceLo, niceHi);
  }

  return {
    scale: (value: number) => ((value - niceLo) / span) * size,
    domain: [niceLo, niceHi],
    ticks,
  };
}

export interface BandScaleOptions {
  /** Number of slots. */
  count: number;
  /** Total pixel length to divide up. */
  size: number;
  /** Fraction of each slot left empty as gutter, 0–1. Defaults to 0.2. */
  padding?: number;
}

export function createBandScale({ count, size, padding = 0.2 }: BandScaleOptions): BandScale {
  const slots = Math.max(1, count);
  const slotWidth = size / slots;
  const clampedPadding = Math.min(Math.max(padding, 0), 1);
  const bandWidth = slotWidth * (1 - clampedPadding);
  const offset = (slotWidth - bandWidth) / 2;

  return {
    position: (index: number) => index * slotWidth + offset,
    bandWidth,
    slotWidth,
    center: (index: number) => index * slotWidth + slotWidth / 2,
  };
}

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Plot gutters in viewBox units. These are text-metric allowances — room for
 * a y tick label on the left, a category label underneath — not design
 * values. No spacing token means "as wide as four digits", and an SVG
 * attribute can't read a custom property anyway, so they stay plain numbers.
 */
export const DEFAULT_CHART_MARGIN: ChartMargin = { top: 8, right: 8, bottom: 24, left: 44 };

export interface ChartFrame {
  margin: ChartMargin;
  /** The plot area inside the gutters — the size the scales map onto. */
  innerWidth: number;
  innerHeight: number;
}

/**
 * Splits an outer chart box into gutters plus the inner plot area. Inner
 * dimensions are floored at zero so an undersized box degrades to an empty
 * plot rather than feeding negative sizes into the scales.
 */
export function resolveChartFrame(
  width: number,
  height: number,
  margin?: Partial<ChartMargin>,
): ChartFrame {
  const resolved: ChartMargin = { ...DEFAULT_CHART_MARGIN, ...margin };
  return {
    margin: resolved,
    innerWidth: Math.max(0, width - resolved.left - resolved.right),
    innerHeight: Math.max(0, height - resolved.top - resolved.bottom),
  };
}

export interface UseChartScaleOptions {
  values: number[];
  /** Plot width in px — the band (categorical) axis. */
  width: number;
  /** Plot height in px — the linear (value) axis. */
  height: number;
  tickCount?: number;
  includeZero?: boolean;
  bandPadding?: number;
}

export interface UseChartScaleResult {
  /** Value axis. Note `scale()` returns a distance from the domain minimum, not a y coordinate — see `toY`. */
  linear: LinearScale;
  /** Category axis. */
  band: BandScale;
  /** Converts a value to an SVG y coordinate (origin top-left, so the axis is flipped). */
  toY: (value: number) => number;
  /** The y coordinate of the domain's zero line — where bars start. */
  baselineY: number;
}

/**
 * Memoized band + linear scales for a single series.
 *
 * Deliberately single-series: a multi-series chart also needs a categorical
 * color palette to tell the series apart, and this design system has none yet
 * (see `docs/CHART_TOKEN_REQUIREMENTS.md`). The math here generalizes when
 * that lands — grouped/stacked layout is a second band scale over this one.
 */
export function useChartScale({
  values,
  width,
  height,
  tickCount,
  includeZero,
  bandPadding,
}: UseChartScaleOptions): UseChartScaleResult {
  return useMemo(() => {
    const finite = values.filter((value) => Number.isFinite(value));
    const min = finite.length > 0 ? Math.min(...finite) : 0;
    const max = finite.length > 0 ? Math.max(...finite) : 0;

    const linear = createLinearScale({ min, max, size: height, tickCount, includeZero });
    const band = createBandScale({ count: values.length, size: width, padding: bandPadding });

    const toY = (value: number) => height - linear.scale(value);
    const baselineY = toY(Math.max(linear.domain[0], Math.min(0, linear.domain[1])));

    return { linear, band, toY, baselineY };
  }, [values, width, height, tickCount, includeZero, bandPadding]);
}
