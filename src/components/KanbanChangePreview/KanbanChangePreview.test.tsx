import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KanbanChangePreview, describeKanbanCommand } from './KanbanChangePreview';
import type { KanbanBoardData } from '../../utilities/kanbanReducer';

const board: KanbanBoardData = {
  columns: [
    { id: 'todo', title: 'To do', cardIds: ['a', 'b'] },
    { id: 'done', title: 'Done', cardIds: [] },
  ],
  cards: { a: { id: 'a', title: 'Write spec' }, b: { id: 'b', title: 'Fix login bug' } },
};

describe('describeKanbanCommand', () => {
  it('names cards and columns by title, not id', () => {
    expect(describeKanbanCommand(board, { op: 'move', cardId: 'a', toColumnId: 'done' })).toBe(
      'Move “Write spec” to Done',
    );
  });

  it('distinguishes a reorder from a cross-column move', () => {
    expect(describeKanbanCommand(board, { op: 'move', cardId: 'a', toColumnId: 'todo' })).toBe(
      'Reorder “Write spec” within To do',
    );
  });

  it('describes create, update and delete', () => {
    expect(
      describeKanbanCommand(board, {
        op: 'create',
        columnId: 'todo',
        card: { id: 'n', title: 'New thing' },
      }),
    ).toBe('Add “New thing” to To do');
    expect(
      describeKanbanCommand(board, { op: 'update', cardId: 'a', patch: { status: 'danger' } }),
    ).toBe('Update status on “Write spec”');
    expect(describeKanbanCommand(board, { op: 'delete', cardId: 'b' })).toBe(
      'Delete “Fix login bug”',
    );
  });

  it('falls back to the id when a card is unknown', () => {
    expect(describeKanbanCommand(board, { op: 'delete', cardId: 'ghost' })).toBe('Delete “ghost”');
  });
});

describe('KanbanChangePreview', () => {
  const commands = [
    { op: 'move' as const, cardId: 'a', toColumnId: 'done' },
    { op: 'delete' as const, cardId: 'b' },
  ];

  it('starts with every command checked — the user is confirming, not assembling', () => {
    render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    screen.getAllByRole('checkbox').forEach((box) => expect(box).toBeChecked());
    expect(screen.getByRole('button', { name: 'Apply all changes' })).toBeInTheDocument();
  });

  it('passes only the checked commands to onAccept', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        onAccept={onAccept}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Delete “Fix login bug”' }));
    await user.click(screen.getByRole('button', { name: 'Apply 1 of 2' }));

    expect(onAccept).toHaveBeenCalledWith([commands[0]]);
  });

  it('disables applying when everything is unchecked', async () => {
    const user = userEvent.setup();
    render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    for (const box of screen.getAllByRole('checkbox')) await user.click(box);

    expect(screen.getByRole('button', { name: 'Apply 0 of 2' })).toBeDisabled();
  });

  it('calls onReject when discarded', async () => {
    const user = userEvent.setup();
    const onReject = vi.fn();
    render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        onAccept={vi.fn()}
        onReject={onReject}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onReject).toHaveBeenCalled();
  });

  it('shows why a command was ignored rather than dropping it silently', () => {
    render(
      <KanbanChangePreview
        board={board}
        commands={[]}
        rejected={[{ command: { op: 'delete', cardId: 'ghost' }, reason: 'Unknown card "ghost"' }]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('1 change was ignored:')).toBeInTheDocument();
    expect(screen.getByText('Unknown card "ghost"')).toBeInTheDocument();
  });

  it('renders the model message verbatim', () => {
    render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        message="I grouped these by priority."
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByText('I grouped these by priority.')).toBeInTheDocument();
  });

  it('resets the selection when a new batch arrives', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Delete “Fix login bug”' }));
    rerender(
      <KanbanChangePreview
        board={board}
        commands={[{ op: 'move', cardId: 'b', toColumnId: 'done' }]}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Move “Fix login bug” to Done' })).toBeChecked();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <KanbanChangePreview
        board={board}
        commands={commands}
        rejected={[{ command: { op: 'delete', cardId: 'x' }, reason: 'Unknown card "x"' }]}
        message="Here is what I would do."
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />,
    );

    await expectNoA11yViolations(container);
  });
});
