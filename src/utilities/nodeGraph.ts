export interface NodePoint {
  x: number;
  y: number;
}

export interface NodeRect extends NodePoint {
  width: number;
  height: number;
}

/**
 * One node in a graph. `data` is deliberately `unknown` — a node can hold a
 * string, a form value, or an entire scene parsed from another module (a
 * `Canvas` `scene`, a `Document`'s `pages`); this file never inspects it,
 * only carries it and merges it with what flows in.
 */
export interface NodeData<T = unknown> {
  id: string;
  name: string;
  data: T;
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** Same free-fill escape hatch as `CanvasStickyBlock.color` — see there. */
  color?: string;
}

/** A directed edge: `source`'s output feeds `target`'s input. */
export interface NodeConnectionData {
  id: string;
  source: string;
  target: string;
}

export interface NodeGroupData {
  id: string;
  name: string;
  nodeIds: string[];
}

export interface NodeGraphData<T = unknown> {
  nodes: NodeData<T>[];
  connections: NodeConnectionData[];
  groups: NodeGroupData[];
}

export const DEFAULT_NODE_WIDTH = 220;
export const DEFAULT_NODE_HEIGHT = 110;
export const NODE_GROUP_PADDING = 28;

export function nodeRect(node: NodeData): NodeRect {
  return {
    x: node.x,
    y: node.y,
    width: node.width ?? DEFAULT_NODE_WIDTH,
    height: node.height ?? DEFAULT_NODE_HEIGHT,
  };
}

/** Left-mid — where an incoming connection arrives. */
export function inputPortPoint(node: NodeData): NodePoint {
  const rect = nodeRect(node);
  return { x: rect.x, y: rect.y + rect.height / 2 };
}

/** Right-mid — where an outgoing connection leaves. */
export function outputPortPoint(node: NodeData): NodePoint {
  const rect = nodeRect(node);
  return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
}

export function findNode(nodes: NodeData[], id: string): NodeData | undefined {
  return nodes.find((node) => node.id === id);
}

/**
 * True if `target` can already reach `source` by following existing edges —
 * i.e. adding a `source -> target` edge on top would close a loop. Checked
 * before every new connection so a graph can never enter a state
 * `computeNodeOutput` would have to guard against.
 */
export function wouldCreateCycle(
  source: string,
  target: string,
  connections: NodeConnectionData[],
): boolean {
  if (source === target) return true;
  const visited = new Set<string>();
  const stack = [target];
  while (stack.length > 0) {
    const current = stack.pop() as string;
    if (current === source) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const connection of connections) {
      if (connection.source === current) stack.push(connection.target);
    }
  }
  return false;
}

export function canConnect(
  source: string,
  target: string,
  connections: NodeConnectionData[],
): boolean {
  if (source === target) return false;
  const exists = connections.some(
    (connection) => connection.source === source && connection.target === target,
  );
  if (exists) return false;
  return !wouldCreateCycle(source, target, connections);
}

/**
 * A node's effective output: its own `data` plus every upstream node's
 * `data`, keyed by node id. Keying by id (rather than assuming `data` is a
 * spreadable object) is what lets this work for any shape of `data`,
 * including a primitive or another module's own state shape — the same
 * reason `kanbanSnapshot`/`canvasSnapshot` key their prompt payloads by id
 * rather than guessing a merge strategy.
 *
 * Recomputed on every read rather than cached anywhere, so it always
 * reflects the current graph. The `seen` guard is a safety net, not the
 * primary defense — `canConnect` is what actually keeps cycles out.
 */
export function computeNodeOutput(
  nodeId: string,
  nodes: NodeData[],
  connections: NodeConnectionData[],
  seen: Set<string> = new Set(),
): Record<string, unknown> {
  const node = findNode(nodes, nodeId);
  if (!node || seen.has(nodeId)) return {};
  seen.add(nodeId);

  let merged: Record<string, unknown> = {};
  for (const connection of connections) {
    if (connection.target !== nodeId) continue;
    merged = { ...merged, ...computeNodeOutput(connection.source, nodes, connections, seen) };
  }
  merged[nodeId] = node.data;
  return merged;
}

export function nodesInGroup(group: NodeGroupData, nodes: NodeData[]): NodeData[] {
  return group.nodeIds
    .map((id) => findNode(nodes, id))
    .filter((node): node is NodeData => node !== undefined);
}

/** The bounding box a group's box should draw at — `undefined` once every member is gone, so a caller can drop an empty group's box rather than draw one at the origin. */
export function groupBounds(
  group: NodeGroupData,
  nodes: NodeData[],
  padding = NODE_GROUP_PADDING,
): NodeRect | undefined {
  const members = nodesInGroup(group, nodes);
  if (members.length === 0) return undefined;

  const rects = members.map(nodeRect);
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  // Extra headroom above the members, clear of everything below and to the
  // sides, for the group's own name label.
  const labelHeadroom = padding * 1.8;
  return {
    x: minX - padding,
    y: minY - labelHeadroom,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding + labelHeadroom,
  };
}

/** A left-to-right cubic bezier from an output port to an input port. */
export function connectionPath(start: NodePoint, end: NodePoint): string {
  const reach = Math.max(Math.abs(end.x - start.x) / 2, 40);
  const c1 = { x: start.x + reach, y: start.y };
  const c2 = { x: end.x - reach, y: end.y };
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}
