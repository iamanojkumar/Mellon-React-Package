import { describe, it, expect } from 'vitest';
import { kanbanSnapshot, buildKanbanPrompt } from './kanbanSnapshot';
import type { KanbanBoardData } from './kanbanReducer';

function board(): KanbanBoardData {
  return {
    columns: [
      { id: 'todo', title: 'To do', cardIds: ['a', 'b'], wipLimit: 3 },
      { id: 'done', title: 'Done', cardIds: [] },
    ],
    cards: {
      a: {
        id: 'a',
        title: 'Write spec',
        description: 'Long-form notes',
        status: 'warning',
        tags: ['docs'],
        assignee: { id: 'u1', name: 'Ana Diaz' },
        meta: { secret: true },
      },
      b: { id: 'b', title: 'Fix bug' },
    },
  };
}

describe('kanbanSnapshot', () => {
  it('includes ids, titles and the fields a model needs to act', () => {
    const snapshot = kanbanSnapshot(board());

    expect(snapshot.columns[0]).toMatchObject({ id: 'todo', title: 'To do', wipLimit: 3 });
    expect(snapshot.columns[0]?.cards[0]).toEqual({
      id: 'a',
      title: 'Write spec',
      description: 'Long-form notes',
      status: 'warning',
      assignee: 'Ana Diaz',
      tags: ['docs'],
    });
  });

  it('omits absent optional fields rather than emitting undefined', () => {
    const snapshot = kanbanSnapshot(board());

    expect(snapshot.columns[0]?.cards[1]).toEqual({ id: 'b', title: 'Fix bug' });
  });

  it('does not leak the opaque meta bag', () => {
    const snapshot = kanbanSnapshot(board());

    expect(JSON.stringify(snapshot)).not.toContain('secret');
  });

  it('keeps every column even when its cards are cut', () => {
    const snapshot = kanbanSnapshot(board(), { maxCards: 0 });

    expect(snapshot.columns.map((column) => column.id)).toEqual(['todo', 'done']);
    expect(snapshot.columns[0]?.cards).toEqual([]);
  });

  it('reports truncation instead of presenting a partial board as whole', () => {
    const snapshot = kanbanSnapshot(board(), { maxCards: 1 });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.omittedCardCount).toBe(1);
    expect(snapshot.columns[0]?.cards).toHaveLength(1);
  });

  it('is not truncated when everything fits', () => {
    const snapshot = kanbanSnapshot(board());

    expect(snapshot.truncated).toBe(false);
    expect(snapshot.omittedCardCount).toBe(0);
  });

  it('truncates an over-long description', () => {
    const snapshot = kanbanSnapshot(board(), { maxDescriptionLength: 4 });

    expect(snapshot.columns[0]?.cards[0]?.description).toBe('Long…');
  });

  it('is deterministic for the same input', () => {
    expect(JSON.stringify(kanbanSnapshot(board()))).toBe(JSON.stringify(kanbanSnapshot(board())));
  });
});

describe('buildKanbanPrompt', () => {
  it('carries the request, the board and the command vocabulary', () => {
    const prompt = buildKanbanPrompt('Move Write spec to Done', kanbanSnapshot(board()));

    expect(prompt).toContain('Move Write spec to Done');
    expect(prompt).toContain('"id":"a"');
    expect(prompt).toContain('"op":"move"');
  });

  it('instructs the model to answer rather than mutate for questions', () => {
    const prompt = buildKanbanPrompt('what is blocked?', kanbanSnapshot(board()));

    expect(prompt).toContain('return no commands');
    expect(prompt).toContain('Do not guess');
  });

  it('states truncation in the prompt only when it happened', () => {
    expect(buildKanbanPrompt('x', kanbanSnapshot(board()))).not.toContain('truncated');
    expect(buildKanbanPrompt('x', kanbanSnapshot(board(), { maxCards: 1 }))).toContain(
      '1 card(s) are not shown',
    );
  });
});
