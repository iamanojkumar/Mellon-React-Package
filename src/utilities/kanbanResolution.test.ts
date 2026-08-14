import { describe, it, expect } from 'vitest';
import { parseKanbanResolution, parseKanbanCommand } from './kanbanResolution';

describe('parseKanbanCommand', () => {
  it('accepts each of the four ops', () => {
    expect(parseKanbanCommand({ op: 'move', cardId: 'a', toColumnId: 'done' })).toEqual({
      op: 'move',
      cardId: 'a',
      toColumnId: 'done',
    });
    expect(
      parseKanbanCommand({ op: 'create', columnId: 'todo', card: { id: 'n', title: 'New' } }),
    ).toEqual({ op: 'create', columnId: 'todo', card: { id: 'n', title: 'New' } });
    expect(parseKanbanCommand({ op: 'update', cardId: 'a', patch: { title: 'X' } })).toEqual({
      op: 'update',
      cardId: 'a',
      patch: { title: 'X' },
    });
    expect(parseKanbanCommand({ op: 'delete', cardId: 'a' })).toEqual({
      op: 'delete',
      cardId: 'a',
    });
  });

  it('keeps a numeric index and drops a non-numeric one', () => {
    expect(parseKanbanCommand({ op: 'move', cardId: 'a', toColumnId: 'd', index: 2 })).toEqual({
      op: 'move',
      cardId: 'a',
      toColumnId: 'd',
      index: 2,
    });
    expect(
      parseKanbanCommand({ op: 'move', cardId: 'a', toColumnId: 'd', index: 'two' }),
    ).not.toHaveProperty('index');
  });

  it('rejects unknown ops and missing required fields', () => {
    expect(parseKanbanCommand({ op: 'explode', cardId: 'a' })).toBeUndefined();
    expect(parseKanbanCommand({ op: 'move', cardId: 'a' })).toBeUndefined();
    expect(
      parseKanbanCommand({ op: 'create', columnId: 'todo', card: { id: 'n' } }),
    ).toBeUndefined();
    expect(parseKanbanCommand('nonsense')).toBeUndefined();
    expect(parseKanbanCommand(null)).toBeUndefined();
  });

  it('rejects an update that patches nothing', () => {
    expect(parseKanbanCommand({ op: 'update', cardId: 'a', patch: {} })).toBeUndefined();
    expect(
      parseKanbanCommand({ op: 'update', cardId: 'a', patch: { nonsense: 1 } }),
    ).toBeUndefined();
  });

  it('drops an out-of-vocabulary status rather than passing it through', () => {
    const command = parseKanbanCommand({ op: 'update', cardId: 'a', patch: { status: 'onfire' } });

    expect(command).toBeUndefined();
  });

  it('ignores an attempt to rewrite a card id through a patch', () => {
    const command = parseKanbanCommand({
      op: 'update',
      cardId: 'a',
      patch: { id: 'hijacked', title: 'X' },
    });

    expect(command).toEqual({ op: 'update', cardId: 'a', patch: { title: 'X' } });
  });
});

describe('parseKanbanResolution', () => {
  it('parses a well-formed response', () => {
    const result = parseKanbanResolution(
      JSON.stringify({
        commands: [{ op: 'move', cardId: 'a', toColumnId: 'done' }],
        message: 'Moved it.',
      }),
    );

    expect(result.commands).toHaveLength(1);
    expect(result.message).toBe('Moved it.');
  });

  it('reads JSON out of a code fence', () => {
    const result = parseKanbanResolution(
      '```json\n{"commands":[{"op":"delete","cardId":"a"}]}\n```',
    );

    expect(result.commands).toEqual([{ op: 'delete', cardId: 'a' }]);
  });

  it('keeps the good commands and drops the malformed ones', () => {
    const result = parseKanbanResolution(
      JSON.stringify({
        commands: [
          { op: 'move', cardId: 'a', toColumnId: 'done' },
          { op: 'nonsense' },
          { op: 'delete' },
        ],
      }),
    );

    expect(result.commands).toHaveLength(1);
  });

  it('treats prose as an answer rather than a failure', () => {
    const result = parseKanbanResolution('Two cards are blocked: the login bug and the migration.');

    expect(result.commands).toEqual([]);
    expect(result.message).toContain('Two cards are blocked');
  });

  it('carries highlight ids for a query with no mutation', () => {
    const result = parseKanbanResolution(
      JSON.stringify({ commands: [], message: 'These are blocked.', highlightCardIds: ['a', 'b'] }),
    );

    expect(result.commands).toEqual([]);
    expect(result.highlightCardIds).toEqual(['a', 'b']);
  });

  it('returns nothing actionable for empty input', () => {
    expect(parseKanbanResolution('')).toEqual({ commands: [] });
    expect(parseKanbanResolution('   ')).toEqual({ commands: [] });
  });

  it('survives a JSON array or scalar where an object was expected', () => {
    expect(parseKanbanResolution('[1,2,3]').commands).toEqual([]);
    expect(parseKanbanResolution('42').commands).toEqual([]);
  });
});
