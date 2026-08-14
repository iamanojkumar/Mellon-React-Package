import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  rectsIntersect,
  pointInRect,
  rectFromPoints,
  boundsOf,
  anchorPoint,
  resolveAnchorSides,
  connectorGeometry,
  outlineOrder,
  buildCanvasOutline,
  rectCentre,
} from './canvasGeometry';
import type { CanvasBlockData, CanvasScene } from './canvasReducer';

function block(id: string, x: number, y: number, width = 100, height = 100): CanvasBlockData {
  return { id, kind: 'sticky', text: id, x, y, width, height };
}

describe('snapToGrid', () => {
  it('rounds to the nearest grid line', () => {
    expect(snapToGrid(23, 10)).toBe(20);
    expect(snapToGrid(26, 10)).toBe(30);
    expect(snapToGrid(-23, 10)).toBe(-20);
  });

  it('passes the value through when snapping is off', () => {
    expect(snapToGrid(23.4, 0)).toBe(23.4);
    expect(snapToGrid(23.4, -1)).toBe(23.4);
  });

  it('never returns NaN for a non-finite input', () => {
    expect(snapToGrid(Number.NaN, 10)).toBe(0);
    expect(snapToGrid(Infinity, 10)).toBe(0);
  });
});

describe('rect helpers', () => {
  it('detects overlap but not mere adjacency', () => {
    const a = { x: 0, y: 0, width: 10, height: 10 };
    expect(rectsIntersect(a, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
    expect(rectsIntersect(a, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });

  it('tests point containment inclusive of the edge', () => {
    const rect = { x: 0, y: 0, width: 10, height: 10 };
    expect(pointInRect({ x: 5, y: 5 }, rect)).toBe(true);
    expect(pointInRect({ x: 10, y: 10 }, rect)).toBe(true);
    expect(pointInRect({ x: 11, y: 5 }, rect)).toBe(false);
  });

  it('normalizes a marquee dragged in any direction', () => {
    expect(rectFromPoints({ x: 30, y: 40 }, { x: 10, y: 10 })).toEqual({
      x: 10,
      y: 10,
      width: 20,
      height: 30,
    });
  });

  it('finds the bounding box of several blocks', () => {
    expect(boundsOf([block('a', 0, 0), block('b', 200, 50)])).toEqual({
      x: 0,
      y: 0,
      width: 300,
      height: 150,
    });
  });

  it('has no bounds for an empty selection', () => {
    expect(boundsOf([])).toBeUndefined();
  });

  it('centres a rect', () => {
    expect(rectCentre({ x: 0, y: 0, width: 10, height: 20 })).toEqual({ x: 5, y: 10 });
  });
});

describe('anchors', () => {
  const rect = { x: 0, y: 0, width: 100, height: 50 };

  it('places each anchor on the middle of its edge', () => {
    expect(anchorPoint(rect, 'top')).toEqual({ x: 50, y: 0 });
    expect(anchorPoint(rect, 'bottom')).toEqual({ x: 50, y: 50 });
    expect(anchorPoint(rect, 'left')).toEqual({ x: 0, y: 25 });
    expect(anchorPoint(rect, 'right')).toEqual({ x: 100, y: 25 });
  });

  it('leaves from the side it is heading towards', () => {
    const origin = { x: 0, y: 0, width: 100, height: 100 };

    expect(resolveAnchorSides(origin, { x: 300, y: 0, width: 100, height: 100 })).toEqual({
      from: 'right',
      to: 'left',
    });
    expect(resolveAnchorSides(origin, { x: -300, y: 0, width: 100, height: 100 })).toEqual({
      from: 'left',
      to: 'right',
    });
    expect(resolveAnchorSides(origin, { x: 0, y: 300, width: 100, height: 100 })).toEqual({
      from: 'bottom',
      to: 'top',
    });
    expect(resolveAnchorSides(origin, { x: 0, y: -300, width: 100, height: 100 })).toEqual({
      from: 'top',
      to: 'bottom',
    });
  });

  it('commits to the dominant axis on a diagonal', () => {
    const origin = { x: 0, y: 0, width: 100, height: 100 };
    // Further horizontally than vertically, so it leaves horizontally.
    expect(resolveAnchorSides(origin, { x: 400, y: 100, width: 100, height: 100 }).from).toBe(
      'right',
    );
    expect(resolveAnchorSides(origin, { x: 100, y: 400, width: 100, height: 100 }).from).toBe(
      'bottom',
    );
  });
});

describe('connectorGeometry', () => {
  const scene: CanvasScene = {
    blocks: [block('a', 0, 0), block('b', 300, 0)],
    connectors: [],
  };

  it('routes a straight edge between facing anchors', () => {
    const geometry = connectorGeometry(scene, 'a', 'b', 'straight');

    expect(geometry?.start).toEqual({ x: 100, y: 50 });
    expect(geometry?.end).toEqual({ x: 300, y: 50 });
    expect(geometry?.path).toBe('M 100 50 L 300 50');
  });

  it('turns once at the midpoint for an orthogonal edge', () => {
    const geometry = connectorGeometry(
      { blocks: [block('a', 0, 0), block('b', 300, 200)], connectors: [] },
      'a',
      'b',
      'orthogonal',
    );

    expect(geometry?.path).toContain('L 200 50');
    expect(geometry?.path).toContain('L 200 250');
  });

  it('emits a cubic curve by default', () => {
    expect(connectorGeometry(scene, 'a', 'b')?.path).toContain(' C ');
  });

  it('places the label midway between anchors', () => {
    expect(connectorGeometry(scene, 'a', 'b')?.labelPoint).toEqual({ x: 200, y: 50 });
  });

  it('points the arrowhead along the approach', () => {
    expect(connectorGeometry(scene, 'a', 'b', 'straight')?.endAngle).toBe(0);

    const upward = connectorGeometry(
      { blocks: [block('a', 0, 300), block('b', 0, 0)], connectors: [] },
      'a',
      'b',
      'straight',
    );
    expect(upward?.endAngle).toBe(-90);
  });

  it('uses the destination anchor axis for an orthogonal arrowhead', () => {
    // The straight line between centres is diagonal, but the edge actually
    // arrives horizontally, so the arrow must point horizontally.
    const geometry = connectorGeometry(
      { blocks: [block('a', 0, 0), block('b', 300, 200)], connectors: [] },
      'a',
      'b',
      'orthogonal',
    );

    expect(geometry?.endAngle).toBe(0);
  });

  it('returns nothing when an endpoint is missing, rather than throwing', () => {
    expect(connectorGeometry(scene, 'a', 'ghost')).toBeUndefined();
    expect(connectorGeometry(scene, 'ghost', 'b')).toBeUndefined();
  });
});

describe('outline order', () => {
  it('reads top-to-bottom then left-to-right', () => {
    const blocks = [block('c', 0, 400), block('b', 300, 0), block('a', 0, 0)];

    expect(outlineOrder(blocks).map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('treats near-level blocks as one row', () => {
    // 'b' sits 12px lower than 'a' but is plainly beside it, not below it.
    const blocks = [block('b', 300, 12), block('a', 0, 0)];

    expect(outlineOrder(blocks).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('separates rows once past the tolerance', () => {
    const blocks = [block('b', 300, 200), block('a', 0, 0)];

    expect(outlineOrder(blocks).map((item) => item.id)).toEqual(['a', 'b']);
    expect(outlineOrder([block('b', 300, 0), block('a', 0, 200)]).map((i) => i.id)).toEqual([
      'b',
      'a',
    ]);
  });

  it('is stable for blocks at the same point', () => {
    const blocks = [block('b', 0, 0), block('a', 0, 0)];

    expect(outlineOrder(blocks).map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('buildCanvasOutline', () => {
  it('names each block and lists what it points at', () => {
    const scene: CanvasScene = {
      blocks: [
        { id: 'a', kind: 'sticky', text: 'Login', x: 0, y: 0, width: 100, height: 100 },
        { id: 'b', kind: 'sticky', text: 'Auth', x: 300, y: 0, width: 100, height: 100 },
      ],
      connectors: [{ id: 'e1', from: 'a', to: 'b' }],
    };

    const outline = buildCanvasOutline(scene);

    expect(outline.map((entry) => entry.label)).toEqual(['Login', 'Auth']);
    expect(outline[0]?.connectsTo).toEqual(['Auth']);
    expect(outline[1]?.connectsTo).toEqual([]);
  });

  it('reports connections in reading order, not scene order', () => {
    const scene: CanvasScene = {
      blocks: [
        { id: 'b', kind: 'sticky', text: 'Second', x: 300, y: 0, width: 100, height: 100 },
        { id: 'a', kind: 'sticky', text: 'First', x: 0, y: 0, width: 100, height: 100 },
      ],
      connectors: [],
    };

    expect(buildCanvasOutline(scene).map((entry) => entry.label)).toEqual(['First', 'Second']);
  });
});
