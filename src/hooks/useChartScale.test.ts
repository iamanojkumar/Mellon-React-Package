import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  createBandScale,
  createLinearScale,
  useChartScale,
  resolveChartFrame,
  DEFAULT_CHART_MARGIN,
} from './useChartScale';

describe('createLinearScale', () => {
  it('maps the domain endpoints onto [0, size]', () => {
    const { scale } = createLinearScale({ min: 0, max: 100, size: 200 });
    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(200);
    expect(scale(50)).toBe(100);
  });

  it('rounds the domain out to nice tick values', () => {
    const { domain, ticks } = createLinearScale({ min: 0, max: 37, size: 100 });
    expect(domain[0]).toBe(0);
    // 37 rounds up to a nice multiple rather than staying a ragged 37.
    expect(domain[1]).toBeGreaterThanOrEqual(37);
    expect(ticks[0]).toBe(domain[0]);
    expect(ticks[ticks.length - 1]).toBe(domain[1]);
  });

  it('produces evenly spaced ticks without float drift', () => {
    const { ticks } = createLinearScale({ min: 0, max: 1, size: 100, tickCount: 6 });
    const gaps = ticks.slice(1).map((tick, i) => Number((tick - (ticks[i] ?? 0)).toFixed(10)));
    expect(new Set(gaps).size).toBe(1);
    // Repeated += 0.2 would give 0.6000000000000001 without the re-rounding.
    ticks.forEach((tick) => expect(String(tick)).not.toMatch(/\d{10,}/));
  });

  it('includes zero by default, so bars are not exaggerated by a clipped baseline', () => {
    const { domain } = createLinearScale({ min: 90, max: 100, size: 100 });
    expect(domain[0]).toBe(0);
  });

  it('honours includeZero=false for a zoomed value axis', () => {
    const { domain } = createLinearScale({ min: 90, max: 100, size: 100, includeZero: false });
    expect(domain[0]).toBeGreaterThan(0);
  });

  it('handles a negative domain', () => {
    const { domain, scale } = createLinearScale({ min: -50, max: 50, size: 100 });
    expect(domain[0]).toBeLessThanOrEqual(-50);
    expect(domain[1]).toBeGreaterThanOrEqual(50);
    expect(scale(domain[0])).toBe(0);
  });

  it('does not divide by zero on a flat series', () => {
    const { scale, domain, ticks } = createLinearScale({ min: 5, max: 5, size: 100 });
    expect(Number.isFinite(scale(5))).toBe(true);
    expect(domain[0]).not.toBe(domain[1]);
    ticks.forEach((tick) => expect(Number.isFinite(tick)).toBe(true));
  });

  it('does not divide by zero on an all-zero series', () => {
    const { scale, domain } = createLinearScale({ min: 0, max: 0, size: 100 });
    expect(Number.isFinite(scale(0))).toBe(true);
    expect(domain[0]).not.toBe(domain[1]);
  });
});

describe('createBandScale', () => {
  it('divides the width into evenly spaced slots', () => {
    const { position, center } = createBandScale({ count: 4, size: 400, padding: 0 });
    expect(position(0)).toBe(0);
    expect(position(1)).toBe(100);
    expect(center(0)).toBe(50);
  });

  it('reserves padding as gutter and centers the band in its slot', () => {
    const { bandWidth, position } = createBandScale({ count: 2, size: 200, padding: 0.2 });
    expect(bandWidth).toBe(80);
    expect(position(0)).toBe(10);
  });

  it('does not divide by zero when count is 0', () => {
    const { bandWidth, position } = createBandScale({ count: 0, size: 100 });
    expect(Number.isFinite(bandWidth)).toBe(true);
    expect(Number.isFinite(position(0))).toBe(true);
  });

  it('clamps padding to the 0-1 range', () => {
    expect(createBandScale({ count: 2, size: 200, padding: 5 }).bandWidth).toBe(0);
    expect(createBandScale({ count: 2, size: 200, padding: -5 }).bandWidth).toBe(100);
  });
});

describe('useChartScale', () => {
  it('flips the value axis so larger values sit higher on screen', () => {
    const { result } = renderHook(() =>
      useChartScale({ values: [0, 50, 100], width: 300, height: 200 }),
    );
    const { toY } = result.current;
    expect(toY(100)).toBeLessThan(toY(0));
    expect(toY(0)).toBe(200);
  });

  it('puts the baseline at the zero line', () => {
    const { result } = renderHook(() =>
      useChartScale({ values: [10, 20, 30], width: 300, height: 200 }),
    );
    expect(result.current.baselineY).toBe(200);
  });

  it('puts the baseline inside the plot when the domain spans zero', () => {
    const { result } = renderHook(() =>
      useChartScale({ values: [-20, 30], width: 300, height: 200 }),
    );
    const { baselineY } = result.current;
    expect(baselineY).toBeGreaterThan(0);
    expect(baselineY).toBeLessThan(200);
  });

  it('ignores non-finite values when computing the extent', () => {
    const { result } = renderHook(() =>
      useChartScale({ values: [10, Number.NaN, 30], width: 300, height: 200 }),
    );
    expect(Number.isFinite(result.current.toY(30))).toBe(true);
    expect(result.current.linear.domain.every(Number.isFinite)).toBe(true);
  });

  it('survives an empty series', () => {
    const { result } = renderHook(() => useChartScale({ values: [], width: 300, height: 200 }));
    expect(result.current.linear.domain.every(Number.isFinite)).toBe(true);
    expect(Number.isFinite(result.current.band.bandWidth)).toBe(true);
  });
});

describe('resolveChartFrame', () => {
  it('subtracts the gutters from the outer box', () => {
    const { innerWidth, innerHeight } = resolveChartFrame(480, 240, {
      top: 10,
      right: 10,
      bottom: 30,
      left: 50,
    });
    expect(innerWidth).toBe(420);
    expect(innerHeight).toBe(200);
  });

  it('fills unspecified sides from the default margin', () => {
    const { margin } = resolveChartFrame(480, 240, { left: 80 });
    expect(margin.left).toBe(80);
    expect(margin.top).toBe(DEFAULT_CHART_MARGIN.top);
    expect(margin.bottom).toBe(DEFAULT_CHART_MARGIN.bottom);
  });

  it('defaults the whole margin when none is given', () => {
    expect(resolveChartFrame(480, 240).margin).toEqual(DEFAULT_CHART_MARGIN);
  });

  // A negative inner size would flip every mark inside out; an empty plot is
  // the honest degradation.
  it('floors the plot area at zero when the gutters exceed the box', () => {
    const { innerWidth, innerHeight } = resolveChartFrame(20, 20);
    expect(innerWidth).toBe(0);
    expect(innerHeight).toBe(0);
  });
});
