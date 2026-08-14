import { describe, it, expect } from 'vitest';
import { canvasSnapshot, buildCanvasPrompt } from './canvasSnapshot';
import type { CanvasScene } from './canvasReducer';

function scene(): CanvasScene {
  return {
    blocks: [
      { id: 'b', kind: 'sticky', text: 'Second', x: 300, y: 0, width: 160, height: 160 },
      { id: 'a', kind: 'sticky', text: 'First', x: 0, y: 0, width: 160, height: 160 },
      {
        id: 's',
        kind: 'shape',
        shape: 'diamond',
        text: 'Decide',
        x: 0,
        y: 400,
        width: 120,
        height: 120,
      },
    ],
    connectors: [{ id: 'e1', from: 'a', to: 'b', label: 'then' }],
  };
}

describe('canvasSnapshot', () => {
  it('carries geometry, which on a canvas is content rather than decoration', () => {
    const snapshot = canvasSnapshot(scene());

    expect(snapshot.blocks[0]).toEqual({
      id: 'a',
      kind: 'sticky',
      label: 'First',
      x: 0,
      y: 0,
      width: 160,
      height: 160,
    });
  });

  it('serializes in reading order, not scene order', () => {
    expect(canvasSnapshot(scene()).blocks.map((block) => block.id)).toEqual(['a', 'b', 's']);
  });

  it('reports the occupied bounds so new blocks can be placed clear of them', () => {
    expect(canvasSnapshot(scene()).bounds).toEqual({ x: 0, y: 0, width: 460, height: 520 });
  });

  it('has no bounds for an empty scene', () => {
    expect(canvasSnapshot({ blocks: [], connectors: [] }).bounds).toBeUndefined();
  });

  it('includes connectors between surviving blocks', () => {
    expect(canvasSnapshot(scene()).connectors).toEqual([
      { id: 'e1', from: 'a', to: 'b', label: 'then' },
    ]);
  });

  it('drops connectors whose endpoints were truncated away', () => {
    const snapshot = canvasSnapshot(scene(), { maxBlocks: 1 });

    expect(snapshot.blocks).toHaveLength(1);
    expect(snapshot.connectors).toEqual([]);
  });

  it('reports truncation rather than presenting a partial scene as whole', () => {
    const snapshot = canvasSnapshot(scene(), { maxBlocks: 2 });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.omittedBlockCount).toBe(1);
  });

  it('is not truncated when everything fits', () => {
    expect(canvasSnapshot(scene()).truncated).toBe(false);
  });

  it('rounds coordinates so a drag does not emit fifteen decimal places', () => {
    const snapshot = canvasSnapshot({
      blocks: [
        { id: 'a', kind: 'sticky', text: 'x', x: 10.666, y: 3.333, width: 99.9, height: 50.1 },
      ],
      connectors: [],
    });

    expect(snapshot.blocks[0]).toMatchObject({ x: 11, y: 3, width: 100, height: 50 });
  });

  it('truncates an over-long label', () => {
    const snapshot = canvasSnapshot(
      {
        blocks: [
          { id: 'a', kind: 'sticky', text: 'abcdefghij', x: 0, y: 0, width: 10, height: 10 },
        ],
        connectors: [],
      },
      { maxLabelLength: 4 },
    );

    expect(snapshot.blocks[0]?.label).toBe('abcd…');
  });

  it('is deterministic for the same input', () => {
    expect(JSON.stringify(canvasSnapshot(scene()))).toBe(JSON.stringify(canvasSnapshot(scene())));
  });
});

describe('buildCanvasPrompt', () => {
  it('carries the request, the scene and the command vocabulary', () => {
    const prompt = buildCanvasPrompt('add a note', canvasSnapshot(scene()));

    expect(prompt).toContain('add a note');
    expect(prompt).toContain('"id":"a"');
    expect(prompt).toContain('"op":"create"');
  });

  it('tells the model where existing content sits, so it does not stack at the origin', () => {
    const prompt = buildCanvasPrompt('add a note', canvasSnapshot(scene()));

    expect(prompt).toContain('Existing content occupies');
    expect(prompt).toContain('never stack them at the same point');
  });

  it('gives an empty canvas a starting point instead of bounds', () => {
    const prompt = buildCanvasPrompt('add a note', canvasSnapshot({ blocks: [], connectors: [] }));

    expect(prompt).toContain('The canvas is empty');
  });

  it('instructs the model to answer rather than mutate for questions', () => {
    const prompt = buildCanvasPrompt('what is here?', canvasSnapshot(scene()));

    expect(prompt).toContain('return no commands');
    expect(prompt).toContain('Do not guess');
  });

  it('states truncation only when it happened', () => {
    expect(buildCanvasPrompt('x', canvasSnapshot(scene()))).not.toContain('truncated');
    expect(buildCanvasPrompt('x', canvasSnapshot(scene(), { maxBlocks: 1 }))).toContain(
      '2 block(s) are not shown',
    );
  });
});
