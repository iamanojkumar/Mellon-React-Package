import { describe, it, expect } from 'vitest';
import { parseCanvasResolution, parseCanvasCommand, parseCanvasBlock } from './canvasResolution';

describe('parseCanvasBlock', () => {
  it('parses each kind with its own fields', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'sticky', text: 'Hi', x: 1, y: 2 })).toMatchObject({
      kind: 'sticky',
      text: 'Hi',
      x: 1,
      y: 2,
    });
    expect(parseCanvasBlock({ id: 'b', kind: 'shape', shape: 'diamond' })).toMatchObject({
      kind: 'shape',
      shape: 'diamond',
    });
    expect(parseCanvasBlock({ id: 'c', kind: 'frame', title: 'Risks' })).toMatchObject({
      kind: 'frame',
      title: 'Risks',
    });
  });

  it('parses a document block, defaulting pages to one blank page', () => {
    expect(
      parseCanvasBlock({
        id: 'doc',
        kind: 'document',
        pages: ['<p>one</p>', '<p>two</p>'],
        aspectRatio: '16:9',
        layout: 'sidebar',
        header: '<h1>Resume</h1>',
      }),
    ).toMatchObject({
      kind: 'document',
      pages: ['<p>one</p>', '<p>two</p>'],
      aspectRatio: '16:9',
      layout: 'sidebar',
      header: '<h1>Resume</h1>',
    });

    expect(parseCanvasBlock({ id: 'doc2', kind: 'document' })).toMatchObject({
      kind: 'document',
      pages: [''],
    });
  });

  it('accepts a custom width/height aspect ratio for a document block', () => {
    expect(
      parseCanvasBlock({
        id: 'doc',
        kind: 'document',
        aspectRatio: { width: 3, height: 5 },
      }),
    ).toMatchObject({ aspectRatio: { width: 3, height: 5 } });
  });

  it('drops an out-of-vocabulary document aspect ratio and layout instead of passing them through', () => {
    const block = parseCanvasBlock({
      id: 'doc',
      kind: 'document',
      aspectRatio: 'letter',
      layout: 'freeform',
    });
    expect(block).not.toHaveProperty('aspectRatio');
    expect(block).not.toHaveProperty('layout');
  });

  it('supplies a usable default size rather than a zero-size block the reducer rejects', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'sticky', text: 'Hi' })).toMatchObject({
      width: 160,
      height: 160,
    });
  });

  it('defaults position to the origin when omitted', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'sticky', text: 'Hi' })).toMatchObject({ x: 0, y: 0 });
  });

  it('falls back to a rectangle for an unknown shape', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'shape', shape: 'hexagon' })).toMatchObject({
      shape: 'rectangle',
    });
  });

  it('drops an out-of-vocabulary tone instead of passing it through', () => {
    expect(
      parseCanvasBlock({ id: 'a', kind: 'sticky', text: 'x', tone: 'purple' }),
    ).not.toHaveProperty('tone');
  });

  it('rejects a frame or embed with no title — an untitled iframe is unreachable', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'frame' })).toBeUndefined();
    expect(parseCanvasBlock({ id: 'a', kind: 'embed', url: 'https://x.test' })).toBeUndefined();
  });

  it('rejects an image with no src, and treats a missing alt as decorative', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'image' })).toBeUndefined();
    expect(parseCanvasBlock({ id: 'a', kind: 'image', src: '/x.png' })).toMatchObject({ alt: '' });
  });

  it('rejects unknown kinds and malformed input', () => {
    expect(parseCanvasBlock({ id: 'a', kind: 'hologram' })).toBeUndefined();
    expect(parseCanvasBlock({ kind: 'sticky' })).toBeUndefined();
    expect(parseCanvasBlock(null)).toBeUndefined();
  });
});

describe('parseCanvasCommand', () => {
  it('parses each op', () => {
    expect(
      parseCanvasCommand({ op: 'create', block: { id: 'a', kind: 'sticky', text: 'Hi' } }),
    ).toMatchObject({ op: 'create' });
    expect(parseCanvasCommand({ op: 'move', id: 'a', x: 5, y: 6 })).toEqual({
      op: 'move',
      id: 'a',
      x: 5,
      y: 6,
    });
    expect(parseCanvasCommand({ op: 'resize', id: 'a', width: 10, height: 20 })).toEqual({
      op: 'resize',
      id: 'a',
      width: 10,
      height: 20,
    });
    expect(parseCanvasCommand({ op: 'update', id: 'a', patch: { text: 'New' } })).toEqual({
      op: 'update',
      id: 'a',
      patch: { text: 'New' },
    });
    expect(
      parseCanvasCommand({ op: 'connect', connector: { id: 'e', from: 'a', to: 'b' } }),
    ).toMatchObject({ op: 'connect' });
    expect(parseCanvasCommand({ op: 'delete', id: 'a' })).toEqual({ op: 'delete', id: 'a' });
  });

  it('rejects missing or non-numeric coordinates', () => {
    expect(parseCanvasCommand({ op: 'move', id: 'a', x: 5 })).toBeUndefined();
    expect(parseCanvasCommand({ op: 'move', id: 'a', x: 'five', y: 6 })).toBeUndefined();
  });

  it('rejects an update that patches nothing recognisable', () => {
    expect(parseCanvasCommand({ op: 'update', id: 'a', patch: {} })).toBeUndefined();
    expect(parseCanvasCommand({ op: 'update', id: 'a', patch: { nonsense: 1 } })).toBeUndefined();
  });

  it('keeps a zero coordinate, which is falsy but valid', () => {
    expect(parseCanvasCommand({ op: 'move', id: 'a', x: 0, y: 0 })).toEqual({
      op: 'move',
      id: 'a',
      x: 0,
      y: 0,
    });
  });

  it('rejects unknown ops', () => {
    expect(parseCanvasCommand({ op: 'teleport', id: 'a' })).toBeUndefined();
  });
});

describe('parseCanvasResolution', () => {
  it('parses a well-formed response', () => {
    const result = parseCanvasResolution(
      JSON.stringify({
        commands: [{ op: 'move', id: 'a', x: 10, y: 10 }],
        message: 'Moved it.',
      }),
    );

    expect(result.commands).toHaveLength(1);
    expect(result.message).toBe('Moved it.');
  });

  it('reads JSON out of a code fence', () => {
    const result = parseCanvasResolution('```json\n{"commands":[{"op":"delete","id":"a"}]}\n```');

    expect(result.commands).toEqual([{ op: 'delete', id: 'a' }]);
  });

  it('keeps the good commands and drops the malformed ones', () => {
    const result = parseCanvasResolution(
      JSON.stringify({
        commands: [{ op: 'move', id: 'a', x: 1, y: 1 }, { op: 'nonsense' }, { op: 'delete' }],
      }),
    );

    expect(result.commands).toHaveLength(1);
  });

  it('treats prose as an answer rather than a failure', () => {
    const result = parseCanvasResolution('There are three notes and one diagram.');

    expect(result.commands).toEqual([]);
    expect(result.message).toContain('three notes');
  });

  it('carries highlight ids for a query with no mutation', () => {
    const result = parseCanvasResolution(
      JSON.stringify({ commands: [], message: 'These.', highlightBlockIds: ['a', 'b'] }),
    );

    expect(result.commands).toEqual([]);
    expect(result.highlightBlockIds).toEqual(['a', 'b']);
  });

  it("carries the model's own reasoning through as thinking", () => {
    const result = parseCanvasResolution(
      JSON.stringify({ commands: [], message: 'Two notes.', thinking: 'Both mention SSO.' }),
    );

    expect(result.thinking).toBe('Both mention SSO.');
  });

  it('omits thinking when absent, rather than an empty string', () => {
    const result = parseCanvasResolution(JSON.stringify({ commands: [], message: 'Done.' }));

    expect(result.thinking).toBeUndefined();
  });

  it('returns nothing actionable for empty or non-object input', () => {
    expect(parseCanvasResolution('')).toEqual({ commands: [] });
    expect(parseCanvasResolution('[1,2]').commands).toEqual([]);
    expect(parseCanvasResolution('42').commands).toEqual([]);
  });
});
