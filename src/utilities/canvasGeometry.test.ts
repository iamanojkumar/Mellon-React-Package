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
  frameMembers,
  withFrameMembers,
  snapToObjects,
} from './canvasGeometry';
import type { CanvasBlockData, CanvasScene } from './canvasReducer';

function block(id: string, x: number, y: number, width = 100, height = 100): CanvasBlockData {
  return { id, kind: 'sticky', text: id, x, y, width, height };
}

function frame(id: string, x: number, y: number, width: number, height: number): CanvasBlockData {
  return { id, kind: 'frame', title: id, x, y, width, height };
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

describe('snapToObjects', () => {
  it('snaps a left edge to a nearby left edge, within threshold', () => {
    const dragged = { x: 104, y: 0, width: 100, height: 100 };
    const other = { x: 100, y: 300, width: 100, height: 100 };
    const result = snapToObjects(dragged, [other], 6);

    expect(result.x).toBe(100);
    expect(result.snappedX).toBe(true);
    expect(result.y).toBe(0);
    expect(result.snappedY).toBe(false);
  });

  it('snaps centres to each other, not just edges', () => {
    // dragged centre x = 54; other centre x = 50 -- 4px off, within threshold.
    const dragged = { x: 4, y: 0, width: 100, height: 100 };
    const other = { x: 0, y: 300, width: 100, height: 100 };
    const result = snapToObjects(dragged, [other], 6);

    expect(result.x).toBe(0);
    expect(result.snappedX).toBe(true);
  });

  it('does nothing beyond the threshold', () => {
    const dragged = { x: 120, y: 0, width: 100, height: 100 };
    const other = { x: 100, y: 300, width: 100, height: 100 };
    const result = snapToObjects(dragged, [other], 6);

    expect(result.x).toBe(120);
    expect(result.snappedX).toBe(false);
    expect(result.guides).toEqual([]);
  });

  it('picks the closest match when several edges are within threshold', () => {
    const dragged = { x: 103, y: 0, width: 100, height: 100 };
    // Left edge at 100 (3px away) and right-edge-of-other at 105 (2px away
    // from dragged's own left edge) both qualify; 105 is closer.
    const near = { x: -5, y: 300, width: 110, height: 100 }; // right edge = 105
    const far = { x: 100, y: 300, width: 50, height: 50 }; // left edge = 100
    const result = snapToObjects(dragged, [near, far], 6);

    expect(result.x).toBe(105);
  });

  it('draws a guide for every candidate that ends up aligned, not just the closest', () => {
    const dragged = { x: 104, y: 0, width: 100, height: 100 };
    // Both share a left edge at 100 once snapped, and are sized so no other
    // edge (centre/right) coincidentally lines up too.
    const a = { x: 100, y: 300, width: 30, height: 30 };
    const b = { x: 100, y: 500, width: 30, height: 30 };
    const result = snapToObjects(dragged, [a, b], 6);

    const leftEdgeGuides = result.guides.filter(
      (g) => g.orientation === 'vertical' && g.position === 100,
    );
    expect(leftEdgeGuides).toHaveLength(2);
  });

  it('still draws a guide when already exactly flush, not just when it moved', () => {
    const dragged = { x: 100, y: 0, width: 100, height: 100 };
    const other = { x: 100, y: 300, width: 100, height: 100 };
    const result = snapToObjects(dragged, [other], 6);

    expect(result.x).toBe(100);
    expect(result.snappedX).toBe(true);
    expect(result.guides.some((g) => g.orientation === 'vertical')).toBe(true);
  });

  it('snaps x and y independently', () => {
    const dragged = { x: 103, y: 203, width: 100, height: 100 };
    const other = { x: 100, y: 200, width: 100, height: 100 };
    const result = snapToObjects(dragged, [other], 6);

    expect(result.x).toBe(100);
    expect(result.y).toBe(200);
  });
});

describe('frameMembers', () => {
  it('includes a block whose centre falls inside the frame', () => {
    const f = frame('f', 0, 0, 400, 300);
    const inside = block('a', 50, 50, 100, 100);
    expect(frameMembers(f, [f, inside])).toEqual([inside]);
  });

  it('excludes a block whose centre falls outside, even if it overlaps the edge', () => {
    const f = frame('f', 0, 0, 100, 100);
    // Centre at (120, 50) — outside, despite the block overlapping the frame's edge.
    const straddling = block('a', 80, 0, 80, 100);
    expect(frameMembers(f, [f, straddling])).toEqual([]);
  });

  it('never treats another frame as a member', () => {
    const outer = frame('outer', 0, 0, 400, 400);
    const inner = frame('inner', 50, 50, 100, 100);
    expect(frameMembers(outer, [outer, inner])).toEqual([]);
  });
});

describe('withFrameMembers', () => {
  it('adds a frame’s members without duplicating an id already present', () => {
    const f = frame('f', 0, 0, 400, 300);
    const a = block('a', 50, 50);
    const b = block('b', 500, 500);
    expect(withFrameMembers(['f', 'a'], [f, a, b])).toEqual(['f', 'a']);
  });

  it('leaves a plain selection of non-frame blocks untouched', () => {
    const a = block('a', 0, 0);
    const b = block('b', 200, 0);
    expect(withFrameMembers(['a'], [a, b])).toEqual(['a']);
  });

  it('expands every frame in a multi-selection', () => {
    const f1 = frame('f1', 0, 0, 200, 200);
    const f2 = frame('f2', 400, 0, 200, 200);
    const a = block('a', 50, 50);
    const b = block('b', 450, 50);
    expect(withFrameMembers(['f1', 'f2'], [f1, f2, a, b])).toEqual(['f1', 'f2', 'a', 'b']);
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
