import { describe, it, expect } from 'vitest';
import {
  breakDiagramCycles,
  buildCanvasDiagramPrompt,
  diagramCommands,
  diagramNodeShape,
  isPurelyAdditive,
  layoutCanvasDiagram,
  normalizeCanvasDiagram,
  parseCanvasDiagramResolution,
  rankDiagramNodes,
} from './canvasDiagram';
import type { CanvasDiagram } from './canvasDiagram';
import { applyCanvasCommands } from './canvasReducer';
import type { CanvasScene } from './canvasReducer';
import { rectsIntersect } from './canvasGeometry';
import { canvasSnapshot } from './canvasSnapshot';

function scene(): CanvasScene {
  return {
    blocks: [
      { id: 'n1', kind: 'sticky', text: 'Existing', x: 0, y: 0, width: 160, height: 160 },
      { id: 'n2', kind: 'sticky', text: 'Also here', x: 200, y: 0, width: 160, height: 160 },
    ],
    connectors: [],
  };
}

const flow: CanvasDiagram = {
  title: 'Sign-in',
  nodes: [
    { id: 'start', label: 'Open app', role: 'start' },
    { id: 'check', label: 'Token valid?', role: 'decision' },
    { id: 'home', label: 'Show home', role: 'end' },
    { id: 'login', label: 'Show login', role: 'process' },
  ],
  edges: [
    { from: 'start', to: 'check' },
    { from: 'check', to: 'home', label: 'yes' },
    { from: 'check', to: 'login', label: 'no' },
  ],
};

describe('diagramNodeShape', () => {
  it('maps meaning onto the flowchart vocabulary', () => {
    expect(diagramNodeShape({ id: 'a', label: 'x', role: 'decision' })).toBe('diamond');
    expect(diagramNodeShape({ id: 'a', label: 'x', role: 'start' })).toBe('ellipse');
    expect(diagramNodeShape({ id: 'a', label: 'x', role: 'input' })).toBe('parallelogram');
  });

  it('falls back to a rectangle when nothing was said', () => {
    expect(diagramNodeShape({ id: 'a', label: 'x' })).toBe('rectangle');
  });

  it('lets an explicit shape win over the role mapping', () => {
    expect(diagramNodeShape({ id: 'a', label: 'x', role: 'process', shape: 'triangle' })).toBe(
      'triangle',
    );
  });
});

describe('normalizeCanvasDiagram', () => {
  it('drops an edge naming a node that was never declared', () => {
    const { diagram, dropped } = normalizeCanvasDiagram({
      nodes: [{ id: 'a', label: 'A' }],
      edges: [{ from: 'a', to: 'ghost' }],
    });

    expect(diagram.edges).toEqual([]);
    expect(dropped[0]?.reason).toContain('ghost');
  });

  it('drops a self-edge, which has no path to draw', () => {
    const { diagram, dropped } = normalizeCanvasDiagram({
      nodes: [{ id: 'a', label: 'A' }],
      edges: [{ from: 'a', to: 'a' }],
    });

    expect(diagram.edges).toEqual([]);
    expect(dropped[0]?.reason).toContain('itself');
  });

  it('keeps the first of two nodes sharing an id', () => {
    const { diagram, dropped } = normalizeCanvasDiagram({
      nodes: [
        { id: 'a', label: 'First' },
        { id: 'a', label: 'Second' },
      ],
      edges: [],
    });

    expect(diagram.nodes).toEqual([{ id: 'a', label: 'First' }]);
    expect(dropped).toHaveLength(1);
  });

  it('collapses a duplicate edge silently — it is not a mistake worth reporting', () => {
    const { diagram, dropped } = normalizeCanvasDiagram({
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'b' },
      ],
    });

    expect(diagram.edges).toHaveLength(1);
    expect(dropped).toEqual([]);
  });

  it('caps the node count and says what it cut', () => {
    const { diagram, dropped } = normalizeCanvasDiagram(
      {
        nodes: Array.from({ length: 5 }, (_, index) => ({
          id: `n${index}`,
          label: `Node ${index}`,
        })),
        edges: [],
      },
      { maxNodes: 3 },
    );

    expect(diagram.nodes).toHaveLength(3);
    expect(dropped).toHaveLength(2);
    expect(dropped[0]?.reason).toContain('3-node limit');
  });

  it('discards an unknown role rather than passing it through', () => {
    const { diagram } = normalizeCanvasDiagram({
      nodes: [{ id: 'a', label: 'A', role: 'sideways' as never }],
      edges: [],
    });

    expect(diagram.nodes[0]).toEqual({ id: 'a', label: 'A' });
  });
});

describe('breakDiagramCycles', () => {
  it('separates the edge that closes a loop, keeping it for drawing', () => {
    const { forward, back } = breakDiagramCycles(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a', label: 'retry' },
      ],
    );

    expect(forward).toEqual([{ from: 'a', to: 'b' }]);
    expect(back).toEqual([{ from: 'b', to: 'a', label: 'retry' }]);
  });

  it('leaves an acyclic graph alone', () => {
    const { forward, back } = breakDiagramCycles(flow.nodes, flow.edges);

    expect(forward).toEqual(flow.edges);
    expect(back).toEqual([]);
  });

  it('does not mistake a diamond for a cycle', () => {
    // a→b→d and a→c→d revisit d, but never a node still on the stack.
    const { back } = breakDiagramCycles(
      ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id })),
      [
        { from: 'a', to: 'b' },
        { from: 'a', to: 'c' },
        { from: 'b', to: 'd' },
        { from: 'c', to: 'd' },
      ],
    );

    expect(back).toEqual([]);
  });
});

describe('rankDiagramNodes', () => {
  it('puts each node one rank below its deepest predecessor', () => {
    const rank = rankDiagramNodes(flow.nodes, flow.edges);

    expect(rank.get('start')).toBe(0);
    expect(rank.get('check')).toBe(1);
    expect(rank.get('home')).toBe(2);
    expect(rank.get('login')).toBe(2);
  });

  it('ranks a cycle in declaration order rather than chasing it', () => {
    const rank = rankDiagramNodes(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: 'a' },
      ],
    );

    expect([rank.get('a'), rank.get('b'), rank.get('c')]).toEqual([0, 1, 2]);
  });

  /**
   * The bug this guards: a retry edge back to a decision used to drag that
   * decision below every step it feeds, so the flow read bottom-up.
   */
  it('keeps a decision above its own retry loop', () => {
    const rank = rankDiagramNodes(
      [
        { id: 'open', label: 'Open' },
        { id: 'check', label: 'Valid?' },
        { id: 'login', label: 'Log in' },
        { id: 'verify', label: 'Verify' },
      ],
      [
        { from: 'open', to: 'check' },
        { from: 'check', to: 'login' },
        { from: 'login', to: 'verify' },
        { from: 'verify', to: 'check' },
      ],
    );

    expect(rank.get('check')).toBe(1);
    expect(rank.get('verify')).toBe(3);
  });

  it('compacts ranks to consecutive numbers, leaving no empty bands', () => {
    const rank = rankDiagramNodes(
      [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
      ],
      [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
        { from: 'c', to: 'd' },
        { from: 'd', to: 'b' },
      ],
    );

    expect([...new Set(rank.values())].sort()).toEqual([0, 1, 2, 3]);
  });

  it('leaves a disconnected node at the first rank', () => {
    const rank = rankDiagramNodes([...flow.nodes, { id: 'loose', label: 'Loose' }], flow.edges);
    expect(rank.get('loose')).toBe(0);
  });
});

describe('layoutCanvasDiagram', () => {
  it('ranks down the y axis by default', () => {
    const { positions } = layoutCanvasDiagram(flow);

    expect(positions.get('start')!.y).toBeLessThan(positions.get('check')!.y);
    expect(positions.get('check')!.y).toBeLessThan(positions.get('home')!.y);
    expect(positions.get('home')!.y).toBe(positions.get('login')!.y);
  });

  it('ranks along the x axis when asked', () => {
    const { positions } = layoutCanvasDiagram(flow, { direction: 'right' });

    expect(positions.get('start')!.x).toBeLessThan(positions.get('check')!.x);
    expect(positions.get('home')!.x).toBe(positions.get('login')!.x);
  });

  it('overlaps nothing', () => {
    const { positions } = layoutCanvasDiagram(flow);
    const rects = [...positions.values()];

    for (let i = 0; i < rects.length; i += 1) {
      for (let j = i + 1; j < rects.length; j += 1) {
        expect(rectsIntersect(rects[i]!, rects[j]!)).toBe(false);
      }
    }
  });

  it('centres a narrow rank against the widest one', () => {
    const { positions, bounds } = layoutCanvasDiagram(flow);
    const start = positions.get('start')!;
    const startCentre = start.x + start.width / 2;

    expect(startCentre).toBeCloseTo(bounds.x + bounds.width / 2, 5);
  });

  it('is stable — the same graph lays out the same way twice', () => {
    expect([...layoutCanvasDiagram(flow).positions]).toEqual([
      ...layoutCanvasDiagram(flow).positions,
    ]);
  });

  it('handles an empty graph without throwing', () => {
    expect(layoutCanvasDiagram({ nodes: [], edges: [] }).positions.size).toBe(0);
  });
});

describe('diagramCommands', () => {
  it('creates a frame, a shape per node and a connector per edge', () => {
    const commands = diagramCommands(scene(), flow);

    expect(commands.filter((command) => command.op === 'create')).toHaveLength(5);
    expect(commands.filter((command) => command.op === 'connect')).toHaveLength(3);
    expect(commands.some((command) => command.op === 'move' || command.op === 'delete')).toBe(
      false,
    );
  });

  it('applies cleanly, with edges joining the blocks it just created', () => {
    const start = scene();
    const { scene: next, rejected } = applyCanvasCommands(start, diagramCommands(start, flow));

    expect(rejected).toEqual([]);
    expect(next.blocks).toHaveLength(2 + 5);
    expect(next.connectors).toHaveLength(3);
    for (const connector of next.connectors) {
      expect(next.blocks.some((block) => block.id === connector.from)).toBe(true);
      expect(next.blocks.some((block) => block.id === connector.to)).toBe(true);
    }
  });

  it('translates roles into shapes on the created blocks', () => {
    const start = scene();
    const { scene: next } = applyCanvasCommands(start, diagramCommands(start, flow));
    const decision = next.blocks.find(
      (block) => block.kind === 'shape' && block.text === 'Token valid?',
    );

    expect(decision?.kind === 'shape' && decision.shape).toBe('diamond');
  });

  it('lands clear of the existing scene', () => {
    const start = scene();
    const created = diagramCommands(start, flow).flatMap((command) =>
      command.op === 'create' ? [command.block] : [],
    );

    for (const block of created) {
      for (const existing of start.blocks) {
        expect(rectsIntersect(block, existing)).toBe(false);
      }
    }
  });

  it('fits every node inside the title frame', () => {
    const start = scene();
    const created = diagramCommands(start, flow).flatMap((command) =>
      command.op === 'create' ? [command.block] : [],
    );
    const frame = created.find((block) => block.kind === 'frame')!;

    for (const node of created.filter((block) => block.kind === 'shape')) {
      expect(node.x).toBeGreaterThanOrEqual(frame.x);
      expect(node.y).toBeGreaterThanOrEqual(frame.y);
      expect(node.x + node.width).toBeLessThanOrEqual(frame.x + frame.width);
      expect(node.y + node.height).toBeLessThanOrEqual(frame.y + frame.height);
    }
  });

  it('skips the frame when the diagram has no title', () => {
    const commands = diagramCommands(scene(), { ...flow, title: undefined });
    expect(
      commands.some((command) => command.op === 'create' && command.block.kind === 'frame'),
    ).toBe(false);
  });

  it('generates ids that survive drawing a second diagram', () => {
    const start = scene();
    const { scene: once } = applyCanvasCommands(start, diagramCommands(start, flow));
    const { scene: twice, rejected } = applyCanvasCommands(once, diagramCommands(once, flow));

    expect(rejected).toEqual([]);
    expect(new Set(twice.blocks.map((block) => block.id)).size).toBe(twice.blocks.length);
    expect(new Set(twice.connectors.map((edge) => edge.id)).size).toBe(twice.connectors.length);
  });

  it('draws nothing for an empty graph', () => {
    expect(diagramCommands(scene(), { nodes: [], edges: [] })).toEqual([]);
  });
});

describe('isPurelyAdditive', () => {
  it('is true for a generated diagram', () => {
    const start = scene();
    expect(isPurelyAdditive(start, diagramCommands(start, flow))).toBe(true);
  });

  it('is false for anything touching a block that was already there', () => {
    expect(isPurelyAdditive(scene(), [{ op: 'move', id: 'n1', x: 0, y: 0 }])).toBe(false);
    expect(isPurelyAdditive(scene(), [{ op: 'delete', id: 'n1' }])).toBe(false);
  });

  it('is true for a move of a block the same batch created', () => {
    expect(
      isPurelyAdditive(scene(), [
        {
          op: 'create',
          block: { id: 'new', kind: 'sticky', text: 'x', x: 0, y: 0, width: 10, height: 10 },
        },
        { op: 'move', id: 'new', x: 5, y: 5 },
      ]),
    ).toBe(true);
  });
});

describe('parseCanvasDiagramResolution', () => {
  it('reads a fenced graph', () => {
    const parsed = parseCanvasDiagramResolution(
      '```json\n{"title":"Flow","direction":"right","nodes":[{"id":"a","label":"A","role":"start"}],"edges":[{"from":"a","to":"b"}]}\n```',
    );

    expect(parsed.title).toBe('Flow');
    expect(parsed.direction).toBe('right');
    expect(parsed.nodes).toEqual([{ id: 'a', label: 'A', role: 'start' }]);
    expect(parsed.edges).toEqual([{ from: 'a', to: 'b' }]);
  });

  it('treats prose as a message rather than an error', () => {
    const parsed = parseCanvasDiagramResolution('I need the steps before I can draw anything.');

    expect(parsed.nodes).toEqual([]);
    expect(parsed.message).toBe('I need the steps before I can draw anything.');
  });

  it('skips a malformed node instead of discarding the graph', () => {
    const parsed = parseCanvasDiagramResolution(
      JSON.stringify({ nodes: [{ id: 'a', label: 'A' }, { id: 'b' }, 'nope'], edges: [] }),
    );

    expect(parsed.nodes).toEqual([{ id: 'a', label: 'A' }]);
  });

  it('ignores a direction it does not understand', () => {
    const parsed = parseCanvasDiagramResolution(JSON.stringify({ nodes: [], direction: 'up' }));
    expect(parsed.direction).toBeUndefined();
  });
});

describe('buildCanvasDiagramPrompt', () => {
  it('asks for meaning, not geometry', () => {
    const prompt = buildCanvasDiagramPrompt('draw the sign-in flow', canvasSnapshot(scene()));

    expect(prompt).toContain('Do not return positions, sizes or coordinates');
    expect(prompt).toContain('start, end, process, decision, input, output');
    expect(prompt).toContain('draw the sign-in flow');
  });

  it('mentions what is already on the canvas, as context only', () => {
    const prompt = buildCanvasDiagramPrompt('draw it', canvasSnapshot(scene()));
    expect(prompt).toContain('Existing');
  });
});
