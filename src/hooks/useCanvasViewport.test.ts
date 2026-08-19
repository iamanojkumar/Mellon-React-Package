import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCanvasViewport, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM } from './useCanvasViewport';

describe('useCanvasViewport', () => {
  it('starts unpanned at 1x', () => {
    const { result } = renderHook(() => useCanvasViewport());

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1 });
    expect(result.current.transform).toBe('translate(0px, 0px) scale(1)');
  });

  it('accepts an initial viewport', () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ defaultViewport: { panX: 10, panY: 20, zoom: 2 } }),
    );

    expect(result.current.viewport).toEqual({ panX: 10, panY: 20, zoom: 2 });
  });

  it('pans by a delta', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => result.current.panBy(30, -15));

    expect(result.current.viewport).toMatchObject({ panX: 30, panY: -15 });
  });

  it('clamps zoom to the supported range', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => result.current.zoomTo(100));
    expect(result.current.viewport.zoom).toBe(MAX_CANVAS_ZOOM);

    act(() => result.current.zoomTo(0));
    expect(result.current.viewport.zoom).toBe(MIN_CANVAS_ZOOM);
  });

  it('keeps the point under the cursor fixed while zooming', () => {
    const { result } = renderHook(() => useCanvasViewport());
    const origin = { x: 400, y: 300 };

    const before = result.current.toCanvas(origin);
    act(() => result.current.zoomBy(2, origin));
    const after = result.current.toCanvas(origin);

    // This is the whole point of zoom-about-a-point: the canvas coordinate the
    // cursor was over must still be under the cursor afterwards.
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
  });

  it('zooms about the centre when no origin is given', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => result.current.zoomBy(2));

    expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 2 });
  });

  it('round-trips between screen and canvas coordinates', () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ defaultViewport: { panX: 120, panY: -40, zoom: 1.5 } }),
    );

    const canvas = { x: 37, y: 91 };
    const roundTripped = result.current.toCanvas(result.current.toScreen(canvas));

    expect(roundTripped.x).toBeCloseTo(canvas.x);
    expect(roundTripped.y).toBeCloseTo(canvas.y);
  });

  it('converts with pan and zoom applied in the right order', () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ defaultViewport: { panX: 100, panY: 50, zoom: 2 } }),
    );

    expect(result.current.toScreen({ x: 10, y: 10 })).toEqual({ x: 120, y: 70 });
    expect(result.current.toCanvas({ x: 120, y: 70 })).toEqual({ x: 10, y: 10 });
  });

  it('frames a rect within a viewport', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() =>
      result.current.fitTo(
        { x: 0, y: 0, width: 200, height: 200 },
        { width: 1000, height: 1000 },
        0,
      ),
    );

    // The rect's centre lands at the viewport's centre.
    expect(result.current.toScreen({ x: 100, y: 100 })).toEqual({ x: 500, y: 500 });
  });

  it('ignores a degenerate fit rather than dividing by zero', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() =>
      result.current.fitTo({ x: 0, y: 0, width: 0, height: 0 }, { width: 100, height: 100 }),
    );

    expect(result.current.viewport.zoom).toBe(1);
  });

  it('rejects non-finite input instead of poisoning the transform', () => {
    const { result } = renderHook(() => useCanvasViewport());

    act(() => result.current.setViewport({ panX: Number.NaN, panY: 5, zoom: Number.NaN }));

    expect(result.current.viewport.panX).toBe(0);
    expect(result.current.viewport.zoom).toBe(MIN_CANVAS_ZOOM);
    expect(result.current.transform).not.toContain('NaN');
  });

  it('resets to where it started', () => {
    const { result } = renderHook(() =>
      useCanvasViewport({ defaultViewport: { panX: 5, panY: 5, zoom: 2 } }),
    );

    act(() => result.current.panBy(100, 100));
    act(() => result.current.reset());

    expect(result.current.viewport).toEqual({ panX: 5, panY: 5, zoom: 2 });
  });

  it('honours custom zoom bounds', () => {
    const { result } = renderHook(() => useCanvasViewport({ minZoom: 0.5, maxZoom: 1.5 }));

    act(() => result.current.zoomTo(10));
    expect(result.current.viewport.zoom).toBe(1.5);
  });

  describe('controlled viewport', () => {
    it('reflects the passed-in viewport rather than managing its own state', () => {
      const { result } = renderHook(() =>
        useCanvasViewport({ viewport: { panX: 10, panY: 20, zoom: 2 } }),
      );

      expect(result.current.viewport).toEqual({ panX: 10, panY: 20, zoom: 2 });
    });

    it('calls onViewportChange instead of updating state itself', () => {
      const onViewportChange = vi.fn();
      const { result, rerender } = renderHook(
        ({ viewport }) => useCanvasViewport({ viewport, onViewportChange }),
        { initialProps: { viewport: { panX: 0, panY: 0, zoom: 1 } } },
      );

      act(() => result.current.panBy(10, 0));
      expect(onViewportChange).toHaveBeenCalledWith({ panX: 10, panY: 0, zoom: 1 });
      // Controlled: the hook's own viewport hasn't moved until the caller
      // feeds the changed value back in as a prop.
      expect(result.current.viewport).toEqual({ panX: 0, panY: 0, zoom: 1 });

      rerender({ viewport: { panX: 10, panY: 0, zoom: 1 } });
      expect(result.current.viewport).toEqual({ panX: 10, panY: 0, zoom: 1 });
    });
  });
});
