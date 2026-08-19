import { useCallback, useMemo } from 'react';
import type { CanvasPoint, CanvasRect } from '../utilities/canvasGeometry';
import { useControllableState } from './useControllableState';

/**
 * Pan and zoom for a canvas, plus the conversion between screen pixels and
 * canvas units.
 *
 * The whole scene is one `transform: translate(panX, panY) scale(zoom)` on a
 * single wrapper, so blocks store plain canvas coordinates and never have to
 * know the viewport exists. Converting happens once, at the pointer boundary.
 */

export interface CanvasViewport {
  panX: number;
  panY: number;
  zoom: number;
}

export interface UseCanvasViewportOptions {
  defaultViewport?: Partial<CanvasViewport>;
  minZoom?: number;
  maxZoom?: number;
  /**
   * Controlled viewport — pass this (with `onViewportChange`) so an
   * externally-rendered layer (e.g. a `pdf.js` bitmap) can read and drive the
   * same pan/zoom state the canvas uses, and the two stay pixel-locked.
   * Omit for the hook to manage its own state, same controlled/uncontrolled
   * contract as everywhere else in this library.
   */
  viewport?: CanvasViewport;
  /** Fires on every pan/zoom change, controlled or not. */
  onViewportChange?: (viewport: CanvasViewport) => void;
}

export interface UseCanvasViewportResult {
  viewport: CanvasViewport;
  setViewport: (viewport: CanvasViewport) => void;
  panBy: (dx: number, dy: number) => void;
  /** Zooms by a factor, keeping `origin` (in screen coords, relative to the canvas box) fixed. */
  zoomBy: (factor: number, origin?: CanvasPoint) => void;
  zoomTo: (zoom: number, origin?: CanvasPoint) => void;
  /** Frames a canvas-space rect within a viewport of the given size. */
  fitTo: (
    rect: CanvasRect,
    viewportSize: { width: number; height: number },
    padding?: number,
  ) => void;
  reset: () => void;
  /** Screen point (relative to the canvas box) → canvas coordinates. */
  toCanvas: (point: CanvasPoint) => CanvasPoint;
  /** Canvas coordinates → screen point relative to the canvas box. */
  toScreen: (point: CanvasPoint) => CanvasPoint;
  /** Ready to drop straight onto the world element's `style`. */
  transform: string;
}

export const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = { panX: 0, panY: 0, zoom: 1 };

/**
 * Zoom bounds. Component-intrinsic interaction limits rather than design
 * values: below ~0.1 blocks are unreadable specks, above ~4 a canvas stops
 * being a canvas. No token models "how far may a user zoom".
 */
export const MIN_CANVAS_ZOOM = 0.1;
export const MAX_CANVAS_ZOOM = 4;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function useCanvasViewport(options?: UseCanvasViewportOptions): UseCanvasViewportResult {
  const minZoom = options?.minZoom ?? MIN_CANVAS_ZOOM;
  const maxZoom = options?.maxZoom ?? MAX_CANVAS_ZOOM;

  const initial = useMemo<CanvasViewport>(
    () => ({
      ...DEFAULT_CANVAS_VIEWPORT,
      ...options?.defaultViewport,
      zoom: clamp(options?.defaultViewport?.zoom ?? 1, minZoom, maxZoom),
    }),
    // Initial value only — later changes to the default shouldn't yank the
    // user's viewport out from under them mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [viewport, setViewportState] = useControllableState<CanvasViewport>({
    value: options?.viewport,
    defaultValue: initial,
    onChange: options?.onViewportChange,
  });

  const setViewport = useCallback(
    (next: CanvasViewport) => {
      setViewportState({
        panX: Number.isFinite(next.panX) ? next.panX : 0,
        panY: Number.isFinite(next.panY) ? next.panY : 0,
        zoom: clamp(next.zoom, minZoom, maxZoom),
      });
    },
    [minZoom, maxZoom, setViewportState],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setViewportState({ ...viewport, panX: viewport.panX + dx, panY: viewport.panY + dy });
    },
    [viewport, setViewportState],
  );

  /**
   * Zooming about a point means the canvas coordinate under the cursor must
   * stay under the cursor. Solving `origin = canvasPoint * zoom + pan` for the
   * new pan is what stops the scene sliding away as you wheel-zoom.
   */
  const zoomTo = useCallback(
    (zoom: number, origin?: CanvasPoint) => {
      const nextZoom = clamp(zoom, minZoom, maxZoom);
      if (!origin) {
        setViewportState({ ...viewport, zoom: nextZoom });
        return;
      }

      const canvasX = (origin.x - viewport.panX) / viewport.zoom;
      const canvasY = (origin.y - viewport.panY) / viewport.zoom;

      setViewportState({
        zoom: nextZoom,
        panX: origin.x - canvasX * nextZoom,
        panY: origin.y - canvasY * nextZoom,
      });
    },
    [viewport, minZoom, maxZoom, setViewportState],
  );

  const zoomBy = useCallback(
    (factor: number, origin?: CanvasPoint) => {
      const nextZoom = clamp(viewport.zoom * factor, minZoom, maxZoom);
      if (!origin) {
        setViewportState({ ...viewport, zoom: nextZoom });
        return;
      }

      const canvasX = (origin.x - viewport.panX) / viewport.zoom;
      const canvasY = (origin.y - viewport.panY) / viewport.zoom;

      setViewportState({
        zoom: nextZoom,
        panX: origin.x - canvasX * nextZoom,
        panY: origin.y - canvasY * nextZoom,
      });
    },
    [viewport, minZoom, maxZoom, setViewportState],
  );

  const fitTo = useCallback(
    (rect: CanvasRect, viewportSize: { width: number; height: number }, padding = 48) => {
      if (rect.width <= 0 || rect.height <= 0) return;
      if (viewportSize.width <= 0 || viewportSize.height <= 0) return;

      const zoom = clamp(
        Math.min(
          (viewportSize.width - padding * 2) / rect.width,
          (viewportSize.height - padding * 2) / rect.height,
        ),
        minZoom,
        maxZoom,
      );

      setViewportState({
        zoom,
        panX: viewportSize.width / 2 - (rect.x + rect.width / 2) * zoom,
        panY: viewportSize.height / 2 - (rect.y + rect.height / 2) * zoom,
      });
    },
    [minZoom, maxZoom, setViewportState],
  );

  const reset = useCallback(() => setViewportState(initial), [initial, setViewportState]);

  const toCanvas = useCallback(
    (point: CanvasPoint): CanvasPoint => ({
      x: (point.x - viewport.panX) / viewport.zoom,
      y: (point.y - viewport.panY) / viewport.zoom,
    }),
    [viewport],
  );

  const toScreen = useCallback(
    (point: CanvasPoint): CanvasPoint => ({
      x: point.x * viewport.zoom + viewport.panX,
      y: point.y * viewport.zoom + viewport.panY,
    }),
    [viewport],
  );

  return {
    viewport,
    setViewport,
    panBy,
    zoomBy,
    zoomTo,
    fitTo,
    reset,
    toCanvas,
    toScreen,
    transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
  };
}
