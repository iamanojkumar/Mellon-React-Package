import { describe, it, expect } from 'vitest';
import {
  buildCanvasClusterPrompt,
  clusterCandidates,
  clusterCommands,
  isClusterCandidate,
  normalizeCanvasClusters,
  parseCanvasClusterResolution,
} from './canvasClusters';
import { applyCanvasCommands } from './canvasReducer';
import type { CanvasScene } from './canvasReducer';
import { rectsIntersect } from './canvasGeometry';
import { canvasSnapshot } from './canvasSnapshot';

function scene(): CanvasScene {
  return {
    blocks: [
      { id: 'n1', kind: 'sticky', text: 'Slow signup', x: 0, y: 0, width: 160, height: 160 },
      { id: 'n2', kind: 'sticky', text: 'Confusing email', x: 200, y: 0, width: 160, height: 160 },
      { id: 'n3', kind: 'sticky', text: 'Billing bug', x: 400, y: 0, width: 200, height: 120 },
      {
        id: 's1',
        kind: 'shape',
        shape: 'diamond',
        text: 'Ship?',
        x: 0,
        y: 300,
        width: 120,
        height: 120,
      },
      {
        id: 'img',
        kind: 'image',
        src: '/a.png',
        alt: 'Screenshot',
        x: 600,
        y: 0,
        width: 120,
        height: 120,
      },
      { id: 'f1', kind: 'frame', title: 'Existing', x: -40, y: -40, width: 800, height: 260 },
    ],
    connectors: [],
  };
}

describe('cluster candidates', () => {
  it('offers only blocks with text of their own', () => {
    expect(clusterCandidates(scene()).map((block) => block.id)).toEqual(['n1', 'n2', 'n3', 's1']);
  });

  it('excludes frames, which are containers rather than members', () => {
    const frame = scene().blocks.find((block) => block.id === 'f1');
    expect(frame && isClusterCandidate(frame)).toBe(false);
  });
});

describe('normalizeCanvasClusters', () => {
  it('drops a hallucinated id and says which group referenced it', () => {
    const { groups, dropped } = normalizeCanvasClusters(scene(), [
      { title: 'Onboarding', blockIds: ['n1', 'ghost'] },
    ]);

    expect(groups).toEqual([{ title: 'Onboarding', blockIds: ['n1'] }]);
    expect(dropped[0]?.reason).toContain('ghost');
    expect(dropped[0]?.reason).toContain('Onboarding');
  });

  it('gives a block claimed twice to the first group', () => {
    const { groups, dropped } = normalizeCanvasClusters(scene(), [
      { title: 'Onboarding', blockIds: ['n1', 'n2'] },
      { title: 'Billing', blockIds: ['n2', 'n3'] },
    ]);

    expect(groups).toEqual([
      { title: 'Onboarding', blockIds: ['n1', 'n2'] },
      { title: 'Billing', blockIds: ['n3'] },
    ]);
    expect(dropped).toHaveLength(1);
  });

  it('drops a group left with no members rather than framing nothing', () => {
    const { groups, dropped } = normalizeCanvasClusters(scene(), [
      { title: 'Empty', blockIds: ['ghost'] },
    ]);

    expect(groups).toEqual([]);
    expect(dropped.some((drop) => drop.reason.includes('Empty'))).toBe(true);
  });

  it('drops a group with no title — the title is the frame', () => {
    const { groups } = normalizeCanvasClusters(scene(), [{ title: '  ', blockIds: ['n1'] }]);
    expect(groups).toEqual([]);
  });

  it('honours a candidate restriction, so a selection stays a selection', () => {
    const { groups } = normalizeCanvasClusters(
      scene(),
      [{ title: 'Notes', blockIds: ['n1', 'n2', 'n3'] }],
      ['n1', 'n2'],
    );

    expect(groups[0]?.blockIds).toEqual(['n1', 'n2']);
  });
});

describe('clusterCommands', () => {
  const groups = [
    { title: 'Onboarding', blockIds: ['n1', 'n2'] },
    { title: 'Billing', blockIds: ['n3'] },
  ];

  it('creates one frame per group and moves each member into it', () => {
    const commands = clusterCommands(scene(), groups);

    expect(commands.filter((command) => command.op === 'create')).toHaveLength(2);
    expect(commands.filter((command) => command.op === 'move')).toHaveLength(3);
    expect(commands.some((command) => command.op === 'resize')).toBe(false);
  });

  it('generates frame ids that do not collide with the scene', () => {
    const withCluster1: CanvasScene = {
      ...scene(),
      blocks: [
        ...scene().blocks,
        { id: 'cluster-1', kind: 'frame', title: 'Taken', x: 0, y: 0, width: 100, height: 100 },
      ],
    };

    const ids = clusterCommands(withCluster1, groups).flatMap((command) =>
      command.op === 'create' ? [command.block.id] : [],
    );

    expect(ids).toEqual(['cluster-2', 'cluster-3']);
  });

  it('lands every member inside its own frame', () => {
    const start = scene();
    const { scene: next, rejected } = applyCanvasCommands(start, clusterCommands(start, groups));
    expect(rejected).toEqual([]);

    const frame = next.blocks.find(
      (block) => block.kind === 'frame' && block.title === 'Onboarding',
    );
    const members = ['n1', 'n2'].map((id) => next.blocks.find((block) => block.id === id));

    for (const member of members) {
      expect(frame && member).toBeTruthy();
      expect(member!.x).toBeGreaterThanOrEqual(frame!.x);
      expect(member!.y).toBeGreaterThanOrEqual(frame!.y);
      expect(member!.x + member!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
      expect(member!.y + member!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
    }
  });

  it('never overlaps two members of the same group', () => {
    const start = scene();
    const { scene: next } = applyCanvasCommands(start, [
      ...clusterCommands(start, [{ title: 'All', blockIds: ['n1', 'n2', 'n3', 's1'] }]),
    ]);

    const members = ['n1', 'n2', 'n3', 's1'].map((id) =>
      next.blocks.find((block) => block.id === id)!,
    );

    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        expect(rectsIntersect(members[i]!, members[j]!)).toBe(false);
      }
    }
  });

  it('places the frames clear of everything that is not moving', () => {
    const start = scene();
    const commands = clusterCommands(start, groups);
    const frames = commands.flatMap((command) => (command.op === 'create' ? [command.block] : []));
    const staying = start.blocks.filter((block) => !['n1', 'n2', 'n3'].includes(block.id));

    for (const frame of frames) {
      for (const block of staying) {
        expect(rectsIntersect(frame, block)).toBe(false);
      }
    }
  });

  it('keeps every block at the size its author left it', () => {
    const start = scene();
    const { scene: next } = applyCanvasCommands(start, clusterCommands(start, groups));

    for (const before of start.blocks) {
      const after = next.blocks.find((block) => block.id === before.id)!;
      expect([after.width, after.height]).toEqual([before.width, before.height]);
    }
  });

  it('returns nothing for no groups', () => {
    expect(clusterCommands(scene(), [])).toEqual([]);
  });

  it('accepts an explicit origin', () => {
    const [first] = clusterCommands(scene(), groups, { origin: { x: 1000, y: 2000 } });
    expect(first?.op === 'create' && first.block.x).toBe(1000);
    expect(first?.op === 'create' && first.block.y).toBe(2000);
  });
});

describe('parseCanvasClusterResolution', () => {
  it('reads groups out of a fenced JSON response', () => {
    const parsed = parseCanvasClusterResolution(
      '```json\n{"groups":[{"title":"Onboarding","blockIds":["n1"]}],"message":"Two themes."}\n```',
    );

    expect(parsed.groups).toEqual([{ title: 'Onboarding', blockIds: ['n1'] }]);
    expect(parsed.message).toBe('Two themes.');
  });

  it('treats prose as a message rather than an error', () => {
    const parsed = parseCanvasClusterResolution('These notes have nothing in common.');

    expect(parsed.groups).toEqual([]);
    expect(parsed.message).toBe('These notes have nothing in common.');
  });

  it('skips a malformed group instead of discarding the batch', () => {
    const parsed = parseCanvasClusterResolution(
      JSON.stringify({
        groups: [{ title: 'Good', blockIds: ['n1'] }, { blockIds: ['n2'] }, { title: 'Empty' }],
      }),
    );

    expect(parsed.groups).toEqual([{ title: 'Good', blockIds: ['n1'] }]);
  });
});

describe('buildCanvasClusterPrompt', () => {
  it('asks for grouping only, never for coordinates', () => {
    const prompt = buildCanvasClusterPrompt(canvasSnapshot(scene()));

    expect(prompt).toContain('Do not return positions or sizes');
    expect(prompt).toContain('at most one group');
  });

  it('lists only the candidates it was given', () => {
    const prompt = buildCanvasClusterPrompt(canvasSnapshot(scene()), {
      candidateIds: ['n1', 'n2'],
    });

    expect(prompt).toContain('"n1"');
    expect(prompt).not.toContain('"img"');
  });

  it('says when the scene was truncated', () => {
    const prompt = buildCanvasClusterPrompt(canvasSnapshot(scene(), { maxBlocks: 2 }));
    expect(prompt).toContain('not shown');
  });
});
