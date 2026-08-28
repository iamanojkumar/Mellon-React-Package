import { describe, it, expect } from 'vitest';
import {
  applyCanvasCommands,
  validateCanvasCommands,
  canvasBlockLabel,
  connectorsForBlock,
  findCanvasBlock,
  MIN_BLOCK_SIZE,
} from './canvasReducer';
import type { CanvasBlockData, CanvasScene } from './canvasReducer';

function sticky(id: string, text = id, x = 0, y = 0): CanvasBlockData {
  return { id, kind: 'sticky', text, x, y, width: 160, height: 160 };
}

function scene(): CanvasScene {
  return {
    blocks: [sticky('a', 'Alpha', 0, 0), sticky('b', 'Beta', 200, 0)],
    connectors: [{ id: 'e1', from: 'a', to: 'b' }],
  };
}

describe('applyCanvasCommands — create', () => {
  it('appends a block, preserving array order as z-order', () => {
    const { scene: next, rejected } = applyCanvasCommands(scene(), [
      { op: 'create', block: sticky('c', 'Gamma') },
    ]);

    expect(next.blocks.map((block) => block.id)).toEqual(['a', 'b', 'c']);
    expect(rejected).toEqual([]);
  });

  it('rejects a duplicate id', () => {
    const { rejected } = applyCanvasCommands(scene(), [{ op: 'create', block: sticky('a') }]);

    expect(rejected[0]?.reason).toContain('already exists');
  });

  it('rejects non-finite or non-positive geometry', () => {
    const bad = applyCanvasCommands(scene(), [
      { op: 'create', block: { ...sticky('c'), x: Number.NaN } },
      { op: 'create', block: { ...sticky('d'), width: 0 } },
    ]);

    expect(bad.applied).toEqual([]);
    expect(bad.rejected).toHaveLength(2);
  });
});

describe('applyCanvasCommands — move and resize', () => {
  it('moves a block', () => {
    const { scene: next } = applyCanvasCommands(scene(), [{ op: 'move', id: 'a', x: 50, y: 75 }]);

    expect(findCanvasBlock(next, 'a')).toMatchObject({ x: 50, y: 75 });
  });

  it('rejects a move of an unknown block', () => {
    const before = scene();
    const { scene: next, rejected } = applyCanvasCommands(before, [
      { op: 'move', id: 'ghost', x: 1, y: 1 },
    ]);

    expect(rejected[0]?.reason).toContain('ghost');
    expect(next).toEqual(before);
  });

  it('clamps a resize below the minimum rather than rejecting it', () => {
    // A resize drag emits sub-minimum values continuously as the pointer
    // crosses the edge; rejecting each would stutter instead of stopping.
    const { scene: next, rejected } = applyCanvasCommands(scene(), [
      { op: 'resize', id: 'a', width: 2, height: 2 },
    ]);

    expect(rejected).toEqual([]);
    expect(findCanvasBlock(next, 'a')).toMatchObject({
      width: MIN_BLOCK_SIZE,
      height: MIN_BLOCK_SIZE,
    });
  });

  it('rejects a non-finite resize', () => {
    const { rejected } = applyCanvasCommands(scene(), [
      { op: 'resize', id: 'a', width: Number.NaN, height: 10 },
    ]);

    expect(rejected).toHaveLength(1);
  });
});

describe('applyCanvasCommands — update', () => {
  it('merges the patch', () => {
    const { scene: next } = applyCanvasCommands(scene(), [
      { op: 'update', id: 'a', patch: { label: 'Renamed' } },
    ]);

    expect(findCanvasBlock(next, 'a')?.label).toBe('Renamed');
  });

  it('rejects an empty patch and an unknown block', () => {
    const { rejected } = applyCanvasCommands(scene(), [
      { op: 'update', id: 'a', patch: {} },
      { op: 'update', id: 'ghost', patch: { label: 'x' } },
    ]);

    expect(rejected).toHaveLength(2);
  });
});

describe('applyCanvasCommands — connect and delete', () => {
  it('connects two blocks', () => {
    const { scene: next } = applyCanvasCommands(scene(), [
      { op: 'connect', connector: { id: 'e2', from: 'b', to: 'a', label: 'back' } },
    ]);

    expect(next.connectors).toHaveLength(2);
  });

  it('rejects self-connection, unknown endpoints and duplicate ids', () => {
    const { rejected } = applyCanvasCommands(scene(), [
      { op: 'connect', connector: { id: 'x', from: 'a', to: 'a' } },
      { op: 'connect', connector: { id: 'y', from: 'a', to: 'ghost' } },
      { op: 'connect', connector: { id: 'e1', from: 'b', to: 'a' } },
    ]);

    expect(rejected).toHaveLength(3);
    expect(rejected[0]?.reason).toContain('itself');
  });

  it('deleting a block takes its connectors with it', () => {
    const { scene: next } = applyCanvasCommands(scene(), [{ op: 'delete', id: 'a' }]);

    expect(next.blocks.map((block) => block.id)).toEqual(['b']);
    expect(next.connectors).toEqual([]);
  });

  it('deletes a connector by its own id, leaving the blocks alone', () => {
    const { scene: next } = applyCanvasCommands(scene(), [{ op: 'delete', id: 'e1' }]);

    expect(next.connectors).toEqual([]);
    expect(next.blocks).toHaveLength(2);
  });

  it('rejects deleting something that does not exist', () => {
    const { rejected } = applyCanvasCommands(scene(), [{ op: 'delete', id: 'ghost' }]);

    expect(rejected[0]?.reason).toContain('ghost');
  });
});

describe('applyCanvasCommands — sequencing and purity', () => {
  it('validates against the scene as of that point in the sequence', () => {
    const {
      scene: next,
      applied,
      rejected,
    } = applyCanvasCommands(scene(), [
      { op: 'create', block: sticky('c', 'Gamma') },
      { op: 'connect', connector: { id: 'e2', from: 'a', to: 'c' } },
    ]);

    expect(rejected).toEqual([]);
    expect(applied).toHaveLength(2);
    expect(next.connectors.map((connector) => connector.id)).toEqual(['e1', 'e2']);
  });

  it('keeps applying valid commands after dropping an invalid one', () => {
    const { applied, rejected } = applyCanvasCommands(scene(), [
      { op: 'move', id: 'ghost', x: 0, y: 0 },
      { op: 'move', id: 'a', x: 10, y: 10 },
    ]);

    expect(applied).toHaveLength(1);
    expect(rejected).toHaveLength(1);
  });

  it('does not mutate the scene it was given', () => {
    const before = scene();
    const snapshot = JSON.stringify(before);

    applyCanvasCommands(before, [
      { op: 'move', id: 'a', x: 99, y: 99 },
      { op: 'delete', id: 'b' },
    ]);

    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('validateCanvasCommands reports the split without a scene', () => {
    const result = validateCanvasCommands(scene(), [
      { op: 'move', id: 'a', x: 1, y: 1 },
      { op: 'delete', id: 'ghost' },
    ]);

    expect(result.applied).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result).not.toHaveProperty('scene');
  });
});

describe('helpers', () => {
  it('finds connectors touching a block from either end', () => {
    expect(connectorsForBlock(scene(), 'b')).toHaveLength(1);
    expect(connectorsForBlock(scene(), 'ghost')).toEqual([]);
  });

  it('derives a readable label per block kind', () => {
    expect(canvasBlockLabel(sticky('a', 'Ship it'))).toBe('Ship it');
    expect(
      canvasBlockLabel({
        id: 't',
        kind: 'text',
        html: '<p>Hello <b>world</b></p>',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    ).toBe('Hello world');
    expect(
      canvasBlockLabel({
        id: 'i',
        kind: 'image',
        src: 's',
        alt: 'A chart',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    ).toBe('A chart');
    expect(
      canvasBlockLabel({
        id: 's',
        kind: 'shape',
        shape: 'diamond',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    ).toBe('diamond');
    expect(canvasBlockLabel({ id: 'd', kind: 'divider', x: 0, y: 0, width: 1, height: 1 })).toBe(
      'Divider',
    );
  });

  it('prefers an explicit label over the derived one', () => {
    expect(canvasBlockLabel({ ...sticky('a', 'Ship it'), label: 'Release note' })).toBe(
      'Release note',
    );
  });

  it('falls back for empty content rather than returning an empty name', () => {
    expect(canvasBlockLabel(sticky('a', ''))).toBe('Empty note');
  });

  it('names a document block from its header, falling back to a page count', () => {
    expect(
      canvasBlockLabel({
        id: 'doc',
        kind: 'document',
        pages: ['a', 'b'],
        header: '<h1>Resume</h1>',
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    ).toBe('Resume (2 pages)');

    expect(
      canvasBlockLabel({
        id: 'doc2',
        kind: 'document',
        pages: ['a'],
        x: 0,
        y: 0,
        width: 1,
        height: 1,
      }),
    ).toBe('Document, 1 page');
  });
});
