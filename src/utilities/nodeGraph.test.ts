import { describe, expect, it } from 'vitest';
import {
  canConnect,
  computeNodeOutput,
  connectionPath,
  groupBounds,
  inputPortPoint,
  nodeRect,
  nodesInGroup,
  outputPortPoint,
  wouldCreateCycle,
  type NodeConnectionData,
  type NodeData,
  type NodeGroupData,
} from './nodeGraph';

function node(id: string, overrides: Partial<NodeData> = {}): NodeData {
  return { id, name: id, data: { value: id }, x: 0, y: 0, ...overrides };
}

describe('nodeRect / port points', () => {
  it('falls back to the default size when width/height are unset', () => {
    const rect = nodeRect(node('a', { x: 10, y: 20 }));
    expect(rect).toEqual({ x: 10, y: 20, width: 220, height: 110 });
  });

  it('places the input port at left-mid and the output port at right-mid', () => {
    const a = node('a', { x: 0, y: 0, width: 200, height: 100 });
    expect(inputPortPoint(a)).toEqual({ x: 0, y: 50 });
    expect(outputPortPoint(a)).toEqual({ x: 200, y: 50 });
  });
});

describe('wouldCreateCycle / canConnect', () => {
  it('rejects a self connection', () => {
    expect(wouldCreateCycle('a', 'a', [])).toBe(true);
    expect(canConnect('a', 'a', [])).toBe(false);
  });

  it('allows a fresh connection with no existing edges', () => {
    expect(canConnect('a', 'b', [])).toBe(true);
  });

  it('rejects a duplicate connection', () => {
    const connections: NodeConnectionData[] = [{ id: 'c1', source: 'a', target: 'b' }];
    expect(canConnect('a', 'b', connections)).toBe(false);
  });

  it('rejects a connection that would close a loop through existing edges', () => {
    const connections: NodeConnectionData[] = [
      { id: 'c1', source: 'a', target: 'b' },
      { id: 'c2', source: 'b', target: 'c' },
    ];
    // c -> a would let a reach itself via a -> b -> c -> a.
    expect(canConnect('c', 'a', connections)).toBe(false);
    expect(wouldCreateCycle('c', 'a', connections)).toBe(true);
  });

  it('allows a connection that merely fans out from an existing source', () => {
    const connections: NodeConnectionData[] = [{ id: 'c1', source: 'a', target: 'b' }];
    expect(canConnect('a', 'c', connections)).toBe(true);
  });
});

describe('computeNodeOutput', () => {
  const nodes: NodeData[] = [
    node('a', { data: { value: 'A' } }),
    node('b', { data: { value: 'B' } }),
    node('c', { data: { value: 'C' } }),
  ];

  it('is just the node itself when it has no incoming connections', () => {
    expect(computeNodeOutput('a', nodes, [])).toEqual({ a: { value: 'A' } });
  });

  it('merges in the upstream node once connected', () => {
    const connections: NodeConnectionData[] = [{ id: 'c1', source: 'a', target: 'b' }];
    expect(computeNodeOutput('b', nodes, connections)).toEqual({
      a: { value: 'A' },
      b: { value: 'B' },
    });
  });

  it('carries the whole chain through a multi-hop connection', () => {
    const connections: NodeConnectionData[] = [
      { id: 'c1', source: 'a', target: 'b' },
      { id: 'c2', source: 'b', target: 'c' },
    ];
    expect(computeNodeOutput('c', nodes, connections)).toEqual({
      a: { value: 'A' },
      b: { value: 'B' },
      c: { value: 'C' },
    });
  });

  it('merges every input for a node with multiple incoming connections', () => {
    const fanIn: NodeData[] = [node('x'), node('y'), node('z')];
    const connections: NodeConnectionData[] = [
      { id: 'c1', source: 'x', target: 'z' },
      { id: 'c2', source: 'y', target: 'z' },
    ];
    expect(computeNodeOutput('z', fanIn, connections)).toEqual({
      x: { value: 'x' },
      y: { value: 'y' },
      z: { value: 'z' },
    });
  });

  it('returns an empty object for an id that does not exist', () => {
    expect(computeNodeOutput('missing', nodes, [])).toEqual({});
  });

  it('holds arbitrary non-object data, not just plain objects', () => {
    const withPrimitive: NodeData[] = [node('a', { data: 42 }), node('b', { data: 'text' })];
    const connections: NodeConnectionData[] = [{ id: 'c1', source: 'a', target: 'b' }];
    expect(computeNodeOutput('b', withPrimitive, connections)).toEqual({ a: 42, b: 'text' });
  });
});

describe('nodesInGroup / groupBounds', () => {
  const nodes: NodeData[] = [
    node('a', { x: 0, y: 0, width: 100, height: 50 }),
    node('b', { x: 200, y: 100, width: 100, height: 50 }),
  ];

  it('resolves member ids to nodes, dropping any that no longer exist', () => {
    const group: NodeGroupData = { id: 'g1', name: 'Group', nodeIds: ['a', 'missing', 'b'] };
    expect(nodesInGroup(group, nodes).map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('is undefined once every member is gone', () => {
    const group: NodeGroupData = { id: 'g1', name: 'Group', nodeIds: ['missing'] };
    expect(groupBounds(group, nodes)).toBeUndefined();
  });

  it('bounds every member with padding', () => {
    const group: NodeGroupData = { id: 'g1', name: 'Group', nodeIds: ['a', 'b'] };
    const bounds = groupBounds(group, nodes, 10);
    expect(bounds).toBeDefined();
    expect(bounds!.x).toBe(-10);
    expect(bounds!.width).toBe(200 + 100 - 0 + 20);
  });
});

describe('connectionPath', () => {
  it('starts and ends exactly at the two ports', () => {
    const path = connectionPath({ x: 0, y: 10 }, { x: 100, y: 50 });
    expect(path.startsWith('M 0 10')).toBe(true);
    expect(path.endsWith('100 50')).toBe(true);
  });
});
