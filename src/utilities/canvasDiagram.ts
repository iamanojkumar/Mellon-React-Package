import type { CanvasBlockData, CanvasCommand, CanvasScene, CanvasShapeKind } from './canvasReducer';
import { findCanvasBlock } from './canvasReducer';
import { boundsOf } from './canvasGeometry';
import type { CanvasPoint, CanvasRect } from './canvasGeometry';
import type { CanvasSnapshot } from './canvasSnapshot';

/**
 * Diagram generation: the model supplies a **graph**, this file supplies the
 * drawing.
 *
 * Same split as `canvasClusters`, applied to a harder case. A model asked to
 * "draw the sign-in flow" as raw `create` commands has to invent coordinates
 * for every box and keep them consistent with the edges between them — which is
 * how you get overlapping shapes and connectors crossing through their own
 * nodes. Asked instead for nodes and edges, it answers in the vocabulary the
 * question is actually about, and the layered layout below turns that into
 * geometry that is deterministic, testable without a DOM, and the same every
 * time for the same graph.
 *
 * This is why `aiDiagram` exists alongside the prompt bar rather than being a
 * phrasing of it: "draw the sign-in flow" typed into `aiPrompt` still goes
 * through the general command path, where the model owns placement.
 */

/**
 * What a node *means*, which the model is asked for instead of a shape.
 *
 * Mapping meaning onto the flowchart vocabulary is a convention the library
 * knows and the model shouldn't have to — and it keeps the vocabulary
 * consistent across responses. A `shape` may still be given explicitly and
 * wins when it is.
 *
 * The shape is decoration on top of the label, never the only carrier of the
 * meaning: `CanvasShape` renders geometry with no semantics, so "is the token
 * valid?" has to read as a question in the text as well as look like a diamond.
 */
export type CanvasDiagramRole = 'start' | 'end' | 'process' | 'decision' | 'input' | 'output';

const ROLE_SHAPE: Record<CanvasDiagramRole, CanvasShapeKind> = {
  start: 'ellipse',
  end: 'ellipse',
  process: 'rectangle',
  decision: 'diamond',
  input: 'parallelogram',
  output: 'parallelogram',
};

export interface CanvasDiagramNode {
  /** Local to the response — real block ids are generated, so a model can use "start". */
  id: string;
  label: string;
  role?: CanvasDiagramRole;
  /** Overrides the role mapping. */
  shape?: CanvasShapeKind;
}

export interface CanvasDiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface CanvasDiagram {
  nodes: CanvasDiagramNode[];
  edges: CanvasDiagramEdge[];
  /** Frames the diagram under this name when given. */
  title?: string;
  /** Rank direction. Defaults to `'down'`. */
  direction?: CanvasDiagramDirection;
}

export interface CanvasDiagramResolution extends CanvasDiagram {
  /** Prose — an explanation, or a refusal. Rendered verbatim. */
  message?: string;
}

export type CanvasDiagramDirection = 'down' | 'right';

/** A node or edge the canvas refused to draw, and why. */
export interface CanvasDiagramDrop {
  reason: string;
}

export interface CanvasDiagramLayoutOptions {
  direction?: CanvasDiagramDirection;
  /** Node box, in canvas units. Defaults to 170 × 96. */
  nodeWidth?: number;
  nodeHeight?: number;
  /** Space between nodes in the same rank. Defaults to 48. */
  gap?: number;
  /** Space between ranks. Defaults to 72. */
  rankGap?: number;
  /** Top-left of the diagram. Defaults to clear of the existing scene. */
  origin?: CanvasPoint;
  /** Padding between the title frame and the nodes. Defaults to 40. */
  framePadding?: number;
  /** Prefix for generated ids. Defaults to `'dg'`. */
  idPrefix?: string;
}

export interface CanvasDiagramOptions extends CanvasDiagramLayoutOptions {
  /** Nodes to ask for. Prompt guidance only — a resolver may ignore it. */
  maxNodes?: number;
}

export const DEFAULT_DIAGRAM_LAYOUT: Required<
  Omit<CanvasDiagramLayoutOptions, 'origin' | 'direction'>
> & { direction: CanvasDiagramDirection } = {
  direction: 'down',
  nodeWidth: 170,
  nodeHeight: 96,
  gap: 48,
  rankGap: 72,
  framePadding: 40,
  idPrefix: 'dg',
};

export const DEFAULT_DIAGRAM_MAX_NODES = 40;

const SHAPES: readonly CanvasShapeKind[] = [
  'rectangle',
  'ellipse',
  'diamond',
  'triangle',
  'parallelogram',
];

const ROLES: readonly CanvasDiagramRole[] = [
  'start',
  'end',
  'process',
  'decision',
  'input',
  'output',
];

export function diagramNodeShape(node: CanvasDiagramNode): CanvasShapeKind {
  if (node.shape && SHAPES.includes(node.shape)) return node.shape;
  return node.role ? ROLE_SHAPE[node.role] : 'rectangle';
}

/**
 * Drops what can't be drawn and reports why — drop-and-report again, one level
 * above the reducer, where the failures are graph-shaped: an edge to a node
 * that was never declared, a node id used twice, a node pointing at itself.
 */
export function normalizeCanvasDiagram(
  diagram: CanvasDiagram,
  options?: { maxNodes?: number },
): { diagram: CanvasDiagram; dropped: CanvasDiagramDrop[] } {
  const maxNodes = options?.maxNodes ?? DEFAULT_DIAGRAM_MAX_NODES;
  const dropped: CanvasDiagramDrop[] = [];

  const nodes: CanvasDiagramNode[] = [];
  const seen = new Set<string>();

  for (const node of diagram.nodes ?? []) {
    const id = node.id?.trim();
    const label = node.label?.trim();
    if (!id || !label) {
      dropped.push({ reason: 'A node with no id or label was ignored.' });
      continue;
    }
    if (seen.has(id)) {
      dropped.push({ reason: `Node id “${id}” appeared twice; the second was ignored.` });
      continue;
    }
    if (nodes.length >= maxNodes) {
      dropped.push({ reason: `“${label}” was beyond the ${maxNodes}-node limit.` });
      continue;
    }
    seen.add(id);
    nodes.push({
      id,
      label,
      ...(node.role && ROLES.includes(node.role) ? { role: node.role } : {}),
      ...(node.shape && SHAPES.includes(node.shape) ? { shape: node.shape } : {}),
    });
  }

  const edges: CanvasDiagramEdge[] = [];
  const edgeSeen = new Set<string>();

  for (const edge of diagram.edges ?? []) {
    const from = edge.from?.trim();
    const to = edge.to?.trim();
    if (!from || !to || !seen.has(from) || !seen.has(to)) {
      dropped.push({ reason: `An edge from “${edge.from}” to “${edge.to}” had no such node.` });
      continue;
    }
    if (from === to) {
      dropped.push({ reason: `“${from}” pointed at itself, which has no path to draw.` });
      continue;
    }
    const key = `${from}→${to}`;
    if (edgeSeen.has(key)) continue;
    edgeSeen.add(key);
    edges.push({ from, to, ...(edge.label?.trim() ? { label: edge.label.trim() } : {}) });
  }

  return {
    diagram: {
      nodes,
      edges,
      ...(diagram.title?.trim() ? { title: diagram.title.trim() } : {}),
      ...(diagram.direction ? { direction: diagram.direction } : {}),
    },
    dropped,
  };
}

/**
 * Splits the edges into the forward graph and the **back edges** that close a
 * loop, by depth-first search in declaration order.
 *
 * Ranking a graph with a cycle in it is meaningless — every node in the loop is
 * "below" the others — and it doesn't just look odd, it inverts the drawing: a
 * retry edge pointing back at a decision drags that decision below the steps it
 * feeds, so the flow reads bottom-up. Standard practice is to rank the graph
 * without its back edges and then draw them anyway, which is what this returns:
 * the loop is still visible as an arrow going back up, where a reader expects
 * to find it.
 */
export function breakDiagramCycles(
  nodes: CanvasDiagramNode[],
  edges: CanvasDiagramEdge[],
): { forward: CanvasDiagramEdge[]; back: CanvasDiagramEdge[] } {
  const outgoing = new Map<string, CanvasDiagramEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  const state = new Map<string, 'open' | 'done'>();
  const back = new Set<CanvasDiagramEdge>();

  const visit = (id: string) => {
    state.set(id, 'open');
    for (const edge of outgoing.get(id) ?? []) {
      const seen = state.get(edge.to);
      // Pointing at a node still on the stack closes a loop.
      if (seen === 'open') back.add(edge);
      else if (seen === undefined) visit(edge.to);
    }
    state.set(id, 'done');
  };

  for (const node of nodes) {
    if (!state.has(node.id)) visit(node.id);
  }

  return {
    forward: edges.filter((edge) => !back.has(edge)),
    back: edges.filter((edge) => back.has(edge)),
  };
}

/**
 * Longest-path ranking over the forward graph: every node sits one rank below
 * its deepest predecessor, so the diagram reads in one direction.
 *
 * Back edges are removed first (see `breakDiagramCycles`). The pass cap is a
 * second line of defence rather than the mechanism — with the cycles already
 * broken, relaxation always converges well inside it.
 *
 * Ranks are then compacted to consecutive numbers: relaxation can leave gaps,
 * and since the layout multiplies a rank by a row height, a gap would come out
 * as a band of empty canvas rather than as anything meaningful.
 */
export function rankDiagramNodes(
  nodes: CanvasDiagramNode[],
  edges: CanvasDiagramEdge[],
): Map<string, number> {
  const rank = new Map(nodes.map((node) => [node.id, 0]));
  const { forward } = breakDiagramCycles(nodes, edges);

  for (let pass = 0; pass < nodes.length; pass += 1) {
    let changed = false;
    for (const edge of forward) {
      const from = rank.get(edge.from);
      const to = rank.get(edge.to);
      if (from === undefined || to === undefined) continue;
      if (to <= from) {
        rank.set(edge.to, from + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const levels = [...new Set(rank.values())].sort((a, b) => a - b);
  const compacted = new Map(levels.map((level, index) => [level, index]));

  return new Map([...rank].map(([id, level]) => [id, compacted.get(level) ?? 0]));
}

export interface CanvasDiagramLayout {
  /** Node id → the rect it should occupy, in canvas units. */
  positions: Map<string, CanvasRect>;
  /** The box every node fits inside. */
  bounds: CanvasRect;
}

/**
 * Layered layout: rank along the flow direction, ordered by declaration order
 * across it, each rank centred against the widest one.
 *
 * Declaration order rather than a crossing-minimisation pass, deliberately —
 * the order a model lists nodes in is the order it was thinking about them,
 * which is usually the reading order a person wants, and it makes the layout
 * stable and explainable. A sweep would trade that for slightly fewer crossings
 * on graphs this size.
 */
export function layoutCanvasDiagram(
  diagram: CanvasDiagram,
  options?: CanvasDiagramLayoutOptions,
): CanvasDiagramLayout {
  const direction = options?.direction ?? diagram.direction ?? DEFAULT_DIAGRAM_LAYOUT.direction;
  const nodeWidth = options?.nodeWidth ?? DEFAULT_DIAGRAM_LAYOUT.nodeWidth;
  const nodeHeight = options?.nodeHeight ?? DEFAULT_DIAGRAM_LAYOUT.nodeHeight;
  const gap = options?.gap ?? DEFAULT_DIAGRAM_LAYOUT.gap;
  const rankGap = options?.rankGap ?? DEFAULT_DIAGRAM_LAYOUT.rankGap;
  const origin = options?.origin ?? { x: 0, y: 0 };

  const positions = new Map<string, CanvasRect>();
  if (diagram.nodes.length === 0) {
    return { positions, bounds: { x: origin.x, y: origin.y, width: 0, height: 0 } };
  }

  const rank = rankDiagramNodes(diagram.nodes, diagram.edges);
  const rows = new Map<number, CanvasDiagramNode[]>();
  for (const node of diagram.nodes) {
    const index = rank.get(node.id) ?? 0;
    rows.set(index, [...(rows.get(index) ?? []), node]);
  }

  const down = direction === 'down';
  // Size across the flow, so ranks can be centred against the widest one.
  const acrossSize = down ? nodeWidth : nodeHeight;
  const acrossGap = gap;
  const widest = Math.max(...[...rows.values()].map((row) => row.length));
  const acrossExtent = widest * acrossSize + (widest - 1) * acrossGap;

  for (const [index, row] of rows) {
    const rowExtent = row.length * acrossSize + (row.length - 1) * acrossGap;
    const offset = (acrossExtent - rowExtent) / 2;
    const along = index * ((down ? nodeHeight : nodeWidth) + rankGap);

    row.forEach((node, position) => {
      const across = offset + position * (acrossSize + acrossGap);
      positions.set(node.id, {
        x: origin.x + (down ? across : along),
        y: origin.y + (down ? along : across),
        width: nodeWidth,
        height: nodeHeight,
      });
    });
  }

  const rects = [...positions.values()];
  const minX = Math.min(...rects.map((rect) => rect.x));
  const minY = Math.min(...rects.map((rect) => rect.y));
  const maxX = Math.max(...rects.map((rect) => rect.x + rect.width));
  const maxY = Math.max(...rects.map((rect) => rect.y + rect.height));

  return {
    positions,
    bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY },
  };
}

/** First `prefix-n` not already taken, so a second diagram can't collide with the first. */
function nextId(taken: Set<string>, prefix: string): string {
  let index = 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  taken.add(id);
  return id;
}

/**
 * Turns a validated graph into the commands that draw it: an optional title
 * frame, a `create` per node, then a `connect` per edge.
 *
 * The diagram is placed **clear of everything already on the canvas** — it adds
 * content rather than rearranging any, so there is no case where landing on top
 * of existing work is what the user meant.
 *
 * Edges are `orthogonal` because a layered diagram reads as a flowchart, where
 * right-angled routing is the convention; the curve default is for loose
 * connections between arbitrary blocks.
 */
export function diagramCommands(
  scene: CanvasScene,
  diagram: CanvasDiagram,
  options?: CanvasDiagramLayoutOptions,
): CanvasCommand[] {
  if (diagram.nodes.length === 0) return [];

  const framePadding = options?.framePadding ?? DEFAULT_DIAGRAM_LAYOUT.framePadding;
  const idPrefix = options?.idPrefix ?? DEFAULT_DIAGRAM_LAYOUT.idPrefix;
  const rankGap = options?.rankGap ?? DEFAULT_DIAGRAM_LAYOUT.rankGap;

  const sceneBounds = boundsOf(scene.blocks);
  const framed = Boolean(diagram.title);
  // The frame's own title strip sits at the top, so nodes start below it.
  const inset = framed ? framePadding : 0;

  const base =
    options?.origin ??
    (sceneBounds
      ? { x: sceneBounds.x, y: sceneBounds.y + sceneBounds.height + rankGap }
      : { x: 0, y: 0 });

  const origin = { x: base.x + inset, y: base.y + inset };
  const layout = layoutCanvasDiagram(diagram, { ...options, origin });

  const taken = new Set(scene.blocks.map((block) => block.id));
  const takenConnectors = new Set(scene.connectors.map((connector) => connector.id));
  const commands: CanvasCommand[] = [];

  // Created first so it paints behind its own nodes — the canvas draws frames
  // before everything else, and scene order is z-order within that band.
  if (diagram.title) {
    commands.push({
      op: 'create',
      block: {
        id: nextId(taken, `${idPrefix}-frame`),
        kind: 'frame',
        title: diagram.title,
        x: base.x,
        y: base.y,
        width: layout.bounds.width + framePadding * 2,
        height: layout.bounds.height + framePadding * 2,
      },
    });
  }

  const blockIdOf = new Map<string, string>();

  for (const node of diagram.nodes) {
    const rect = layout.positions.get(node.id);
    if (!rect) continue;
    const id = nextId(taken, `${idPrefix}-node`);
    blockIdOf.set(node.id, id);

    const block: CanvasBlockData = {
      id,
      kind: 'shape',
      shape: diagramNodeShape(node),
      text: node.label,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
    commands.push({ op: 'create', block });
  }

  for (const edge of diagram.edges) {
    const from = blockIdOf.get(edge.from);
    const to = blockIdOf.get(edge.to);
    if (!from || !to) continue;
    commands.push({
      op: 'connect',
      connector: {
        id: nextId(takenConnectors, `${idPrefix}-edge`),
        from,
        to,
        variant: 'orthogonal',
        arrow: 'end',
        ...(edge.label ? { label: edge.label } : {}),
      },
    });
  }

  return commands;
}

/** True when nothing in the batch touches a block that was already there. */
export function isPurelyAdditive(scene: CanvasScene, commands: CanvasCommand[]): boolean {
  const created = new Set<string>();

  return commands.every((command) => {
    switch (command.op) {
      case 'create':
        created.add(command.block.id);
        return true;
      case 'connect':
        // An edge onto existing blocks is still additive — it adds a connector
        // and changes neither endpoint.
        return true;
      case 'move':
      case 'resize':
      case 'update':
        return created.has(command.id) || !findCanvasBlock(scene, command.id);
      case 'delete':
        return false;
    }
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unfence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? text).trim();
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

/**
 * Parses a model's raw text into a graph. Prose becomes a `message` with no
 * nodes, as everywhere else in this pipeline: "I need to know what the steps
 * are" is a reasonable reply to "draw the onboarding flow", and a broken
 * response failing the same way means the user reads words while the canvas
 * stays untouched.
 */
export function parseCanvasDiagramResolution(text: string): CanvasDiagramResolution {
  const trimmed = unfence(text);
  if (!trimmed) return { nodes: [], edges: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { nodes: [], edges: [], message: text.trim() };
  }

  if (!isRecord(parsed)) return { nodes: [], edges: [], message: text.trim() };

  const rawNodes = Array.isArray(parsed['nodes']) ? parsed['nodes'] : [];
  const nodes = rawNodes.flatMap((value): CanvasDiagramNode[] => {
    if (!isRecord(value)) return [];
    const id = asString(value['id']);
    const label = asString(value['label']);
    if (!id || !label) return [];
    const role = asString(value['role']) as CanvasDiagramRole | undefined;
    const shape = asString(value['shape']) as CanvasShapeKind | undefined;
    return [
      {
        id,
        label,
        ...(role && ROLES.includes(role) ? { role } : {}),
        ...(shape && SHAPES.includes(shape) ? { shape } : {}),
      },
    ];
  });

  const rawEdges = Array.isArray(parsed['edges']) ? parsed['edges'] : [];
  const edges = rawEdges.flatMap((value): CanvasDiagramEdge[] => {
    if (!isRecord(value)) return [];
    const from = asString(value['from']);
    const to = asString(value['to']);
    if (!from || !to) return [];
    return [{ from, to, ...(asString(value['label']) ? { label: value['label'] as string } : {}) }];
  });

  const direction = asString(parsed['direction']);

  return {
    nodes,
    edges,
    ...(asString(parsed['title']) ? { title: parsed['title'] as string } : {}),
    ...(asString(parsed['message']) ? { message: parsed['message'] as string } : {}),
    ...(direction === 'down' || direction === 'right' ? { direction } : {}),
  };
}

/**
 * The default diagram instruction.
 *
 * Asks for `role` rather than `shape` because meaning is what the model knows —
 * whether a step is a decision is a fact about the process, whereas "decisions
 * are diamonds" is a drawing convention this library already owns.
 */
export function buildCanvasDiagramPrompt(
  request: string,
  snapshot: CanvasSnapshot,
  options?: { maxNodes?: number },
): string {
  const maxNodes = options?.maxNodes ?? DEFAULT_DIAGRAM_MAX_NODES;

  return [
    'You are drafting a diagram for a visual canvas.',
    'Respond with a single JSON object and nothing else.',
    '',
    'Shape:',
    '{"title":"Diagram name","direction":"down","nodes":[{"id":"local-id","label":"Step","role":"process"}],"edges":[{"from":"local-id","to":"other-id","label":"optional"}]}',
    '',
    'Rules:',
    `- At most ${maxNodes} nodes. Keep labels to a few words.`,
    '- role is one of: start, end, process, decision, input, output. Use decision for anything that branches.',
    '- Node ids are local to this response and only used to join edges. Do not reference ids from the canvas.',
    '- Do not return positions, sizes or coordinates. Layout is handled for you.',
    '- Every edge must join two nodes you declared. Label the edges leaving a decision.',
    '- "direction" is "down" for a process or flow, "right" for a pipeline or timeline.',
    '- If the request does not describe something with steps or parts, return no nodes and say why in "message".',
    '',
    snapshot.blocks.length > 0
      ? `For context, the canvas already holds: ${snapshot.blocks
          .slice(0, 20)
          .map((block) => block.label)
          .join('; ')}`
      : '',
    '',
    'Request:',
    request,
  ]
    .filter(Boolean)
    .join('\n');
}
