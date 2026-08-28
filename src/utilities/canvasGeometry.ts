import type { CanvasBlockData, CanvasConnectorVariant, CanvasScene } from './canvasReducer';
import { canvasBlockLabel } from './canvasReducer';

/**
 * All the canvas maths, deliberately pure.
 *
 * Connector routing works from the blocks' stored canvas-space rects rather
 * than from measured DOM, which is what makes the whole geometry layer
 * testable: jsdom has no layout engine and `getBoundingClientRect` returns
 * zeros, so anything that measured elements would be untestable exactly where
 * the bugs live.
 */

export interface CanvasRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasPoint {
  x: number;
  y: number;
}

export type CanvasAnchorSide = 'top' | 'right' | 'bottom' | 'left';

/** Rounds to the nearest grid line. `grid <= 0` disables snapping. */
export function snapToGrid(value: number, grid: number): number {
  if (!Number.isFinite(value)) return 0;
  if (grid <= 0) return value;
  return Math.round(value / grid) * grid;
}

export function blockRect(block: CanvasBlockData): CanvasRect {
  return { x: block.x, y: block.y, width: block.width, height: block.height };
}

export function rectCentre(rect: CanvasRect): CanvasPoint {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

export function rectsIntersect(a: CanvasRect, b: CanvasRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function pointInRect(point: CanvasPoint, rect: CanvasRect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/** Normalizes a drag between two points into a positive-size rect (marquee selection). */
export function rectFromPoints(a: CanvasPoint, b: CanvasPoint): CanvasRect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

/** The bounding box of several rects — the plain-geometry version `boundsOf` (blocks) and a group drag's proposed positions (not yet blocks) both build on. */
export function rectBounds(rects: CanvasRect[]): CanvasRect | undefined {
  if (rects.length === 0) return undefined;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** The bounding box of several blocks — used for framing and zoom-to-fit. */
export function boundsOf(blocks: CanvasBlockData[]): CanvasRect | undefined {
  return rectBounds(blocks.map(blockRect));
}

/** Default magnetic-snap threshold, in canvas units. Interaction geometry, not a design value — how close an edge has to be before it visually reads as "aligned". */
export const DEFAULT_SNAP_THRESHOLD = 6;

export interface CanvasAlignmentGuide {
  /** `'vertical'` draws a constant-x line (a left/centre/right edge match); `'horizontal'` draws a constant-y line (a top/centre/bottom match). */
  orientation: 'vertical' | 'horizontal';
  /** The line's position along its perpendicular axis — x for vertical, y for horizontal. */
  position: number;
  /** The line's own extent, spanning from the dragged rect to the matched one. */
  start: number;
  end: number;
}

export interface CanvasSnapResult {
  /** The dragged rect's origin, adjusted so a matched edge lines up exactly. Unchanged on an axis with no match. */
  x: number;
  y: number;
  /** Whether `x`/`y` moved from an object match — lets a caller skip grid-snapping just that axis rather than fighting the two against each other. */
  snappedX: boolean;
  snappedY: boolean;
  guides: CanvasAlignmentGuide[];
}

/** A rect's left/centre/right (or top/centre/bottom) edges — the positions a magnetic snap can align to. */
function edgesOf(rect: CanvasRect, axis: 'x' | 'y'): number[] {
  return axis === 'x'
    ? [rect.x, rect.x + rect.width / 2, rect.x + rect.width]
    : [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
}

/**
 * Magnetic edge/centre snapping against other blocks, Figma/Miro-style:
 * finds the smallest adjustment (per axis, independently) that lines one of
 * `rect`'s edges or its centre up with one of `others`', within `threshold`,
 * then reports every candidate that ends up aligned at that resolved
 * position as a guide line to draw.
 *
 * Two passes rather than one, because "the best match" and "everything that
 * lines up once you've moved to it" aren't the same question — three blocks
 * already sharing a left edge should all draw a guide, not just whichever one
 * happened to produce the smallest delta.
 */
export function snapToObjects(
  rect: CanvasRect,
  others: CanvasRect[],
  threshold = DEFAULT_SNAP_THRESHOLD,
): CanvasSnapResult {
  /** The smallest-magnitude delta (candidate edge − rect edge) within `threshold`, or `undefined` for no match. Distinct from a match of exactly `0` — a rect already flush with a candidate still owes it a guide line. */
  function bestDelta(axis: 'x' | 'y'): number | undefined {
    let best: number | undefined;
    for (const edge of edgesOf(rect, axis)) {
      for (const other of others) {
        for (const otherEdge of edgesOf(other, axis)) {
          const delta = otherEdge - edge;
          if (
            Math.abs(delta) <= threshold &&
            (best === undefined || Math.abs(delta) < Math.abs(best))
          ) {
            best = delta;
          }
        }
      }
    }
    return best;
  }

  const deltaX = bestDelta('x');
  const deltaY = bestDelta('y');
  const snapped: CanvasRect = { ...rect, x: rect.x + (deltaX ?? 0), y: rect.y + (deltaY ?? 0) };

  /** Every candidate edge that ends up flush with one of `snapped`'s edges, as a guide line spanning both rects. */
  function guidesFor(axis: 'x' | 'y'): CanvasAlignmentGuide[] {
    const EPSILON = 0.5;
    const found: CanvasAlignmentGuide[] = [];
    for (const edge of edgesOf(snapped, axis)) {
      for (const other of others) {
        for (const otherEdge of edgesOf(other, axis)) {
          if (Math.abs(otherEdge - edge) > EPSILON) continue;
          found.push(
            axis === 'x'
              ? {
                  orientation: 'vertical',
                  position: edge,
                  start: Math.min(snapped.y, other.y),
                  end: Math.max(snapped.y + snapped.height, other.y + other.height),
                }
              : {
                  orientation: 'horizontal',
                  position: edge,
                  start: Math.min(snapped.x, other.x),
                  end: Math.max(snapped.x + snapped.width, other.x + other.width),
                },
          );
        }
      }
    }
    return found;
  }

  const guides = [
    ...(deltaX !== undefined ? guidesFor('x') : []),
    ...(deltaY !== undefined ? guidesFor('y') : []),
  ];

  return {
    x: snapped.x,
    y: snapped.y,
    snappedX: deltaX !== undefined,
    snappedY: deltaY !== undefined,
    guides,
  };
}

/**
 * Blocks visually inside `frame` — geometric membership, not a stored
 * relationship, the same "membership is geometric" rule clustering already
 * relies on. A block counts as a member when its centre point falls inside
 * the frame's rect; frames themselves are never members, so a frame nested
 * in another frame doesn't drag both regions' contents at once.
 */
export function frameMembers(frame: CanvasRect, blocks: CanvasBlockData[]): CanvasBlockData[] {
  return blocks.filter(
    (block) => block.kind !== 'frame' && pointInRect(rectCentre(blockRect(block)), frame),
  );
}

/**
 * Every id in `ids`, plus the geometric members of any frame among them — so
 * moving a frame (by drag or keyboard nudge) carries whatever is visually
 * inside it along. Computed fresh from current positions every call, not
 * tracked as state: a note dragged out of a frame on its own simply stops
 * counting next time, with no membership bookkeeping to fall out of sync.
 */
export function withFrameMembers(ids: string[], blocks: CanvasBlockData[]): string[] {
  const expanded = new Set(ids);
  for (const id of ids) {
    const block = blocks.find((candidate) => candidate.id === id);
    if (block?.kind !== 'frame') continue;
    for (const member of frameMembers(blockRect(block), blocks)) {
      expanded.add(member.id);
    }
  }
  return [...expanded];
}

export function anchorPoint(rect: CanvasRect, side: CanvasAnchorSide): CanvasPoint {
  const centre = rectCentre(rect);
  switch (side) {
    case 'top':
      return { x: centre.x, y: rect.y };
    case 'bottom':
      return { x: centre.x, y: rect.y + rect.height };
    case 'left':
      return { x: rect.x, y: centre.y };
    case 'right':
      return { x: rect.x + rect.width, y: centre.y };
  }
}

/**
 * Picks which edges a connector should leave from and arrive at.
 *
 * Compares centre-to-centre offsets and commits to the dominant axis, so a
 * connector leaves the side it's actually heading towards. Ties resolve
 * horizontally, which matches how left-to-right diagrams read.
 */
export function resolveAnchorSides(
  from: CanvasRect,
  to: CanvasRect,
): { from: CanvasAnchorSide; to: CanvasAnchorSide } {
  const a = rectCentre(from);
  const b = rectCentre(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { from: 'right', to: 'left' } : { from: 'left', to: 'right' };
  }
  return dy >= 0 ? { from: 'bottom', to: 'top' } : { from: 'top', to: 'bottom' };
}

function orthogonalPath(start: CanvasPoint, end: CanvasPoint, side: CanvasAnchorSide): string {
  // Turn once at the midpoint of the axis the connector left on, which keeps
  // the elbow clear of both blocks.
  if (side === 'left' || side === 'right') {
    const midX = (start.x + end.x) / 2;
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
  }
  const midY = (start.y + end.y) / 2;
  return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
}

function curvedPath(start: CanvasPoint, end: CanvasPoint, side: CanvasAnchorSide): string {
  // Control points pushed straight out of the anchor side, so the curve leaves
  // and enters perpendicular to the block edge rather than clipping its corner.
  const strength = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2;
  const horizontal = side === 'left' || side === 'right';
  const direction = side === 'left' || side === 'top' ? -1 : 1;

  const c1 = horizontal
    ? { x: start.x + strength * direction, y: start.y }
    : { x: start.x, y: start.y + strength * direction };
  const c2 = horizontal
    ? { x: end.x - strength * direction, y: end.y }
    : { x: end.x, y: end.y - strength * direction };

  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

export interface ConnectorGeometry {
  path: string;
  start: CanvasPoint;
  end: CanvasPoint;
  /** Where a label sits — the midpoint of the straight run between anchors. */
  labelPoint: CanvasPoint;
  /** Degrees, for pointing the arrowhead along the final approach. */
  endAngle: number;
}

/**
 * The full geometry of one edge. Returns `undefined` when either endpoint is
 * missing, which is how a connector to a deleted block simply stops drawing
 * instead of throwing mid-render.
 */
export function connectorGeometry(
  scene: CanvasScene,
  fromId: string,
  toId: string,
  variant: CanvasConnectorVariant = 'curved',
): ConnectorGeometry | undefined {
  const fromBlock = scene.blocks.find((block) => block.id === fromId);
  const toBlock = scene.blocks.find((block) => block.id === toId);
  if (!fromBlock || !toBlock) return undefined;

  const fromRect = blockRect(fromBlock);
  const toRect = blockRect(toBlock);
  const sides = resolveAnchorSides(fromRect, toRect);
  const start = anchorPoint(fromRect, sides.from);
  const end = anchorPoint(toRect, sides.to);

  const path =
    variant === 'straight'
      ? `M ${start.x} ${start.y} L ${end.x} ${end.y}`
      : variant === 'orthogonal'
        ? orthogonalPath(start, end, sides.from)
        : curvedPath(start, end, sides.from);

  // Arrowhead angle from the approach direction. Orthogonal edges arrive along
  // the destination's anchor axis, not along the straight line between centres.
  const approach =
    variant === 'orthogonal'
      ? sides.to === 'left'
        ? { x: 1, y: 0 }
        : sides.to === 'right'
          ? { x: -1, y: 0 }
          : sides.to === 'top'
            ? { x: 0, y: 1 }
            : { x: 0, y: -1 }
      : { x: end.x - start.x, y: end.y - start.y };

  return {
    path,
    start,
    end,
    labelPoint: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    endAngle: (Math.atan2(approach.y, approach.x) * 180) / Math.PI,
  };
}

/**
 * Reading order for the accessible outline: top-to-bottom, then left-to-right,
 * with blocks whose tops are within `rowTolerance` treated as one row.
 *
 * Without the tolerance, two blocks side by side but a few pixels apart
 * vertically would be read in an order that has nothing to do with how they
 * look — which is exactly what makes a spatial layout incomprehensible
 * linearly.
 */
export function outlineOrder(blocks: CanvasBlockData[], rowTolerance = 40): CanvasBlockData[] {
  return [...blocks].sort((a, b) => {
    const sameRow = Math.abs(a.y - b.y) <= rowTolerance;
    if (sameRow) return a.x - b.x || a.id.localeCompare(b.id);
    return a.y - b.y;
  });
}

/** One outline entry: the block, its name, and where its edges go. */
export interface CanvasOutlineEntry {
  block: CanvasBlockData;
  label: string;
  /** Labels of blocks this one points at. */
  connectsTo: string[];
}

export function buildCanvasOutline(scene: CanvasScene, rowTolerance = 40): CanvasOutlineEntry[] {
  const nameOf = new Map(scene.blocks.map((block) => [block.id, canvasBlockLabel(block)]));

  return outlineOrder(scene.blocks, rowTolerance).map((block) => ({
    block,
    label: nameOf.get(block.id) ?? block.id,
    connectsTo: scene.connectors
      .filter((connector) => connector.from === block.id)
      .map((connector) => nameOf.get(connector.to) ?? connector.to),
  }));
}
