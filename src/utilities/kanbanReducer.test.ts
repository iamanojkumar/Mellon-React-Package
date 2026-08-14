import { describe, it, expect } from 'vitest';
import {
  applyKanbanCommands,
  validateKanbanCommands,
  findColumnOfCard,
  isOverWipLimit,
} from './kanbanReducer';
import type { KanbanBoardData, KanbanCard } from './kanbanReducer';

function card(id: string, title = id): KanbanCard {
  return { id, title };
}

function makeBoard(): KanbanBoardData {
  return {
    columns: [
      { id: 'todo', title: 'To do', cardIds: ['a', 'b', 'c'] },
      { id: 'doing', title: 'Doing', cardIds: ['d'], wipLimit: 2 },
      { id: 'done', title: 'Done', cardIds: [] },
    ],
    cards: { a: card('a'), b: card('b'), c: card('c'), d: card('d') },
  };
}

function columnIds(board: KanbanBoardData, columnId: string): string[] {
  return board.columns.find((column) => column.id === columnId)?.cardIds ?? [];
}

describe('applyKanbanCommands — move', () => {
  it('moves a card to another column at the given index', () => {
    const { board, applied, rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'done', index: 0 },
    ]);

    expect(columnIds(board, 'todo')).toEqual(['b', 'c']);
    expect(columnIds(board, 'done')).toEqual(['a']);
    expect(applied).toHaveLength(1);
    expect(rejected).toEqual([]);
  });

  it('appends when no index is given', () => {
    const { board } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'doing' },
    ]);

    expect(columnIds(board, 'doing')).toEqual(['d', 'a']);
  });

  it('treats index as the position after the card has left its old slot', () => {
    // 'a' moves to the end of its own column. Were the card inserted before
    // being removed, it would land at ['b','a','c'] — one short of the drop.
    const { board } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'todo', index: 2 },
    ]);

    expect(columnIds(board, 'todo')).toEqual(['b', 'c', 'a']);
  });

  it('reorders within a column without touching the others', () => {
    const { board } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'c', toColumnId: 'todo', index: 0 },
    ]);

    expect(columnIds(board, 'todo')).toEqual(['c', 'a', 'b']);
    expect(columnIds(board, 'doing')).toEqual(['d']);
  });

  it('clamps an out-of-range index instead of creating holes', () => {
    const high = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'done', index: 99 },
    ]);
    const low = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'c', toColumnId: 'todo', index: -5 },
    ]);

    expect(columnIds(high.board, 'done')).toEqual(['a']);
    expect(columnIds(low.board, 'todo')).toEqual(['c', 'a', 'b']);
  });

  it('rejects an unknown card and leaves the board untouched', () => {
    const before = makeBoard();
    const { board, applied, rejected } = applyKanbanCommands(before, [
      { op: 'move', cardId: 'ghost', toColumnId: 'done' },
    ]);

    expect(applied).toEqual([]);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toContain('ghost');
    expect(board).toEqual(before);
  });

  it('rejects an unknown destination column', () => {
    const { rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'nowhere' },
    ]);

    expect(rejected[0]?.reason).toContain('nowhere');
  });
});

describe('applyKanbanCommands — create, update, delete', () => {
  it('creates a card at an index', () => {
    const { board } = applyKanbanCommands(makeBoard(), [
      { op: 'create', columnId: 'todo', card: card('new', 'New card'), index: 1 },
    ]);

    expect(columnIds(board, 'todo')).toEqual(['a', 'new', 'b', 'c']);
    expect(board.cards['new']?.title).toBe('New card');
  });

  it('rejects a create whose id already exists', () => {
    const { rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'create', columnId: 'done', card: card('a') },
    ]);

    expect(rejected[0]?.reason).toContain('already exists');
  });

  it('merges an update into the existing card', () => {
    const { board } = applyKanbanCommands(makeBoard(), [
      { op: 'update', cardId: 'a', patch: { status: 'danger', tags: ['blocked'] } },
    ]);

    expect(board.cards['a']).toEqual({
      id: 'a',
      title: 'a',
      status: 'danger',
      tags: ['blocked'],
    });
  });

  it('removes a deleted card from both the record and its column', () => {
    const { board } = applyKanbanCommands(makeBoard(), [{ op: 'delete', cardId: 'b' }]);

    expect(board.cards['b']).toBeUndefined();
    expect(columnIds(board, 'todo')).toEqual(['a', 'c']);
  });
});

describe('applyKanbanCommands — sequencing and purity', () => {
  it('validates each command against the board as of that point in the sequence', () => {
    const { board, applied, rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'create', columnId: 'todo', card: card('fresh') },
      { op: 'move', cardId: 'fresh', toColumnId: 'done', index: 0 },
    ]);

    expect(rejected).toEqual([]);
    expect(applied).toHaveLength(2);
    expect(columnIds(board, 'done')).toEqual(['fresh']);
  });

  it('keeps applying valid commands after dropping an invalid one', () => {
    const { board, applied, rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'ghost', toColumnId: 'done' },
      { op: 'move', cardId: 'a', toColumnId: 'done' },
    ]);

    expect(applied).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(columnIds(board, 'done')).toEqual(['a']);
  });

  it('does not mutate the board it was given', () => {
    const before = makeBoard();
    const snapshot = JSON.stringify(before);

    applyKanbanCommands(before, [
      { op: 'move', cardId: 'a', toColumnId: 'done' },
      { op: 'delete', cardId: 'b' },
      { op: 'update', cardId: 'c', patch: { title: 'changed' } },
    ]);

    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('helpers', () => {
  it('finds the column holding a card', () => {
    expect(findColumnOfCard(makeBoard(), 'd')?.id).toBe('doing');
    expect(findColumnOfCard(makeBoard(), 'ghost')).toBeUndefined();
  });

  it('reports a WIP overflow without preventing it', () => {
    const { board, rejected } = applyKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'doing' },
      { op: 'move', cardId: 'b', toColumnId: 'doing' },
    ]);

    const doing = board.columns.find((column) => column.id === 'doing');

    expect(rejected).toEqual([]);
    expect(doing?.cardIds).toEqual(['d', 'a', 'b']);
    expect(isOverWipLimit(doing!)).toBe(true);
  });

  it('validateKanbanCommands reports the same split without a board', () => {
    const result = validateKanbanCommands(makeBoard(), [
      { op: 'move', cardId: 'a', toColumnId: 'done' },
      { op: 'delete', cardId: 'ghost' },
    ]);

    expect(result.applied).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result).not.toHaveProperty('board');
  });
});
