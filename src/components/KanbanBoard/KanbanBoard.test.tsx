import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KanbanBoard } from './KanbanBoard';
import { AIProvider } from '../../providers/AIProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import type { AIClient } from '../../contexts/AIContext';
import type { KanbanBoardData } from '../../utilities/kanbanReducer';

function makeBoard(): KanbanBoardData {
  return {
    columns: [
      { id: 'todo', title: 'To do', cardIds: ['a', 'b'] },
      { id: 'doing', title: 'Doing', cardIds: ['c'], wipLimit: 1 },
      { id: 'done', title: 'Done', cardIds: [] },
    ],
    cards: {
      a: { id: 'a', title: 'Write spec', status: 'warning', tags: ['docs'] },
      b: { id: 'b', title: 'Fix login bug', assignee: { id: 'u1', name: 'Ana Diaz' } },
      c: { id: 'c', title: 'Ship release' },
    },
  };
}

function cardEl(title: string): HTMLElement {
  return screen.getByText(title).closest('li') as HTMLElement;
}

/** `fireEvent.focus` doesn't move `document.activeElement`; a real focus() call does. */
function focusCard(title: string) {
  act(() => {
    cardEl(title).focus();
  });
}

describe('KanbanBoard rendering', () => {
  it('renders every column and card', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.getByRole('heading', { name: 'To do' })).toBeInTheDocument();
    expect(screen.getByText('Write spec')).toBeInTheDocument();
    expect(screen.getByText('Ship release')).toBeInTheDocument();
  });

  it('states the count and WIP limit as text, not colour alone', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.getByText('1 of 1')).toBeInTheDocument();
  });

  it('reports a WIP overflow in words', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.queryByText('Over WIP limit')).not.toBeInTheDocument();

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight} ');

    expect(screen.getByText('Over WIP limit')).toBeInTheDocument();
  });

  it('shows an empty state for a column with no cards', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.getByText('No cards')).toBeInTheDocument();
  });

  it('renders the status word visibly rather than relying on the badge hue', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.getByText('At risk')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<KanbanBoard defaultBoard={makeBoard()} aria-label="Sprint" />);

    await expectNoA11yViolations(container);
  });
});

describe('KanbanBoard keyboard navigation', () => {
  it('moves focus down a column with ArrowDown', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    focusCard('Write spec');
    await user.keyboard('{ArrowDown}');

    expect(cardEl('Fix login bug')).toHaveFocus();
  });

  it('moves focus across columns with ArrowRight', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    focusCard('Write spec');
    await user.keyboard('{ArrowRight}');

    expect(cardEl('Ship release')).toHaveFocus();
  });

  it('does not move the card while merely navigating', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    focusCard('Write spec');
    await user.keyboard('{ArrowRight}{ArrowDown}');

    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('exposes a single tab stop', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(cardEl('Write spec')).toHaveAttribute('tabindex', '0');
    expect(cardEl('Fix login bug')).toHaveAttribute('tabindex', '-1');
  });
});

describe('KanbanBoard keyboard moves', () => {
  it('picks up, moves to another column, and drops', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight} ');

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'doing')?.cardIds).toContain('a');
    expect(next.columns.find((column) => column.id === 'todo')?.cardIds).not.toContain('a');
  });

  it('reorders within a column', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowDown} ');

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'todo')?.cardIds).toEqual(['b', 'a']);
  });

  it('restores the original position on Escape', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight}{ArrowRight}{Escape}');

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'todo')?.cardIds).toEqual(['a', 'b']);
    expect(screen.getByRole('status')).toHaveTextContent('Move cancelled');
  });

  it('announces pick-up, movement and drop', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    focusCard('Write spec');

    await user.keyboard(' ');
    expect(screen.getByRole('status')).toHaveTextContent('Write spec picked up');

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('status')).toHaveTextContent('moved to Doing, position 1 of 2');

    await user.keyboard(' ');
    expect(screen.getByRole('status')).toHaveTextContent('Write spec dropped');
  });

  it('emits one command per applied move', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onCommand={onCommand} />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight} ');

    expect(onCommand).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ op: 'move', cardId: 'a', toColumnId: 'doing' }),
    );
  });

  it('refuses to move a lifted card past the last column', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    focusCard('Ship release');
    await user.keyboard(' {ArrowRight}{ArrowRight}{ArrowRight}');

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'done')?.cardIds).toEqual(['c']);
  });

  it('does not move anything when disabled', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} disabled />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight} ');

    expect(onBoardChange).not.toHaveBeenCalled();
  });
});

describe('KanbanBoard controlled usage', () => {
  it('defers to the controlled board and does not self-update', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    const board = makeBoard();
    render(<KanbanBoard board={board} onBoardChange={onBoardChange} />);

    focusCard('Write spec');
    await user.keyboard(' {ArrowRight} ');

    expect(onBoardChange).toHaveBeenCalled();
    // Still in its original column, because the parent never fed a new board back.
    expect(cardEl('Write spec').closest('section')).toHaveAccessibleName('To do');
  });
});

describe('KanbanBoard card actions', () => {
  it('offers a menu on every card', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(screen.getByRole('button', { name: 'Actions for Write spec' })).toBeInTheDocument();
  });

  it('lists every column except the card’s own as a move target', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} />);

    await user.click(screen.getByRole('button', { name: 'Actions for Write spec' }));

    expect(screen.getByRole('menuitem', { name: 'Move to Doing' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Move to Done' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Move to To do' })).not.toBeInTheDocument();
  });

  it('moves the card through the same reducer a drag uses', async () => {
    const user = userEvent.setup();
    const onCommand = vi.fn();
    const onBoardChange = vi.fn();
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        onCommand={onCommand}
        onBoardChange={onBoardChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Actions for Write spec' }));
    await user.click(screen.getByRole('menuitem', { name: 'Move to Done' }));

    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ op: 'move', cardId: 'a', toColumnId: 'done' }),
    );
    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'done')?.cardIds).toEqual(['a']);
  });

  it('deletes through the menu', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    await user.click(screen.getByRole('button', { name: 'Actions for Write spec' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.cards['a']).toBeUndefined();
  });

  it('can hide delete while keeping the move targets', async () => {
    const user = userEvent.setup();
    render(<KanbanBoard defaultBoard={makeBoard()} hideCardDelete />);

    await user.click(screen.getByRole('button', { name: 'Actions for Write spec' }));

    expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Move to Done' })).toBeInTheDocument();
  });

  it('can be turned off entirely', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} cardMenu={false} />);

    expect(
      screen.queryByRole('button', { name: 'Actions for Write spec' }),
    ).not.toBeInTheDocument();
  });

  it('renders consumer actions alongside the menu', () => {
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        cardActions={(card) => <button type="button">Open {card.title}</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open Write spec' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for Write spec' })).toBeInTheDocument();
  });

  it('keeps consumer actions when renderCard replaces the face', () => {
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        renderCard={(card) => <span>{card.id}</span>}
        cardActions={(card) => <button type="button">Open {card.title}</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open Write spec' })).toBeInTheDocument();
  });

  it('does not steal the menu button’s own keystrokes for a card move', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(<KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} />);

    const trigger = screen.getByRole('button', { name: 'Actions for Write spec' });
    act(() => trigger.focus());
    await user.keyboard(' ');

    // Space opened the menu instead of lifting the card.
    expect(onBoardChange).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Move to Done' })).toBeInTheDocument();
  });

  it('disables the menu trigger when the board is disabled', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} disabled />);

    expect(screen.getByRole('button', { name: 'Actions for Write spec' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------- AI layer

/** Deterministic stand-in — no real client, key or network exists anywhere in src/. */
function mockClient(reply: string | (() => Promise<string>)): AIClient {
  return { complete: typeof reply === 'string' ? async () => reply : reply };
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

async function ask(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.type(screen.getByLabelText('Ask or instruct the board'), text);
  await user.click(screen.getByRole('button', { name: 'Send' }));
}

describe('KanbanBoard AI availability', () => {
  it('renders nothing AI-related without a provider or resolver', () => {
    render(<KanbanBoard defaultBoard={makeBoard()} aiPrompt />);

    expect(screen.queryByLabelText('Ask or instruct the board')).not.toBeInTheDocument();
  });

  it('renders markup identical to the non-AI board when inert', () => {
    // `useId` values differ between two separate renders (the card menu uses
    // them for aria-controls), so they're normalized — everything else must
    // match exactly.
    const normalize = (html: string) => html.replace(/_r_[0-9a-z]+_/g, '_id_');

    const withFlag = render(<KanbanBoard defaultBoard={makeBoard()} aiPrompt />);
    const flagged = normalize(withFlag.container.innerHTML);
    withFlag.unmount();

    const without = render(<KanbanBoard defaultBoard={makeBoard()} />);

    expect(flagged).toBe(normalize(without.container.innerHTML));
  });

  it('stays inert when a provider is mounted but aiPrompt is not set', () => {
    render(
      <AIProvider client={mockClient('{}')}>
        <KanbanBoard defaultBoard={makeBoard()} />
      </AIProvider>,
    );

    expect(screen.queryByLabelText('Ask or instruct the board')).not.toBeInTheDocument();
  });

  it('shows the prompt bar when an AIProvider is mounted', () => {
    render(
      <AIProvider client={mockClient('{}')}>
        <KanbanBoard defaultBoard={makeBoard()} aiPrompt />
      </AIProvider>,
    );

    expect(screen.getByLabelText('Ask or instruct the board')).toBeInTheDocument();
  });

  it('shows the prompt bar for a resolver alone, with no AIProvider', () => {
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        aiPrompt
        resolveCommands={async () => ({ commands: [] })}
      />,
    );

    expect(screen.getByLabelText('Ask or instruct the board')).toBeInTheDocument();
  });
});

describe('KanbanBoard AI query path', () => {
  it('answers a question without touching the board', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(
          json({ commands: [], message: 'Two cards are blocked.', highlightCardIds: ['a'] }),
        )}
      >
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is blocked?');

    // Twice on purpose: the visible answer, plus the live region that tells a
    // screen-reader user it arrived — a plain <p> announces nothing on its own.
    // They land in separate commits, so this waits for both rather than
    // catching the frame in between.
    await vi.waitFor(() => expect(screen.getAllByText('Two cards are blocked.')).toHaveLength(2));
    expect(onBoardChange).not.toHaveBeenCalled();
    expect(cardEl('Write spec')).toHaveAttribute('data-highlighted');
  });

  it('labels a highlighted card for screen readers, not just with a ring', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider
        client={mockClient(json({ commands: [], message: 'Here.', highlightCardIds: ['a'] }))}
      >
        <KanbanBoard defaultBoard={makeBoard()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is blocked?');

    expect(await screen.findByText('Referenced in the answer')).toBeInTheDocument();
  });

  it('treats prose that is not JSON as an answer rather than an error', async () => {
    const user = userEvent.setup();
    render(
      <AIProvider client={mockClient('Nothing is blocked right now.')}>
        <KanbanBoard defaultBoard={makeBoard()} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'what is blocked?');

    expect((await screen.findAllByText('Nothing is blocked right now.')).length).toBeGreaterThan(0);
  });
});

describe('KanbanBoard AI apply path', () => {
  it('applies a single non-destructive command immediately', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(json({ commands: [{ op: 'move', cardId: 'a', toColumnId: 'done' }] }))}
      >
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'move write spec to done');

    await vi.waitFor(() => expect(onBoardChange).toHaveBeenCalled());
    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'done')?.cardIds).toEqual(['a']);
  });

  it('offers an undo toast for an auto-applied change', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AIProvider
          client={mockClient(json({ commands: [{ op: 'move', cardId: 'a', toColumnId: 'done' }] }))}
        >
          <KanbanBoard defaultBoard={makeBoard()} aiPrompt />
        </AIProvider>
      </ToastProvider>,
    );

    await ask(user, 'move write spec to done');

    expect(await screen.findByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('restores the previous board when undo is activated', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <AIProvider
          client={mockClient(json({ commands: [{ op: 'move', cardId: 'a', toColumnId: 'done' }] }))}
        >
          <KanbanBoard defaultBoard={makeBoard()} aiPrompt />
        </AIProvider>
      </ToastProvider>,
    );

    await ask(user, 'move write spec to done');
    await user.click(await screen.findByRole('button', { name: 'Undo' }));

    expect(cardEl('Write spec').closest('section')).toHaveAccessibleName('To do');
  });

  it('applies without a ToastProvider rather than throwing', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(json({ commands: [{ op: 'move', cardId: 'a', toColumnId: 'done' }] }))}
      >
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'move write spec to done');

    await vi.waitFor(() => expect(onBoardChange).toHaveBeenCalled());
  });
});

describe('KanbanBoard AI staging path', () => {
  const twoMoves = json({
    commands: [
      { op: 'move', cardId: 'a', toColumnId: 'done' },
      { op: 'move', cardId: 'b', toColumnId: 'done' },
    ],
  });

  it('stages a multi-command batch instead of applying it', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider client={mockClient(twoMoves)}>
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'tidy up');

    expect(await screen.findByRole('region', { name: 'Proposed changes' })).toBeInTheDocument();
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('always stages a delete, even on its own', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider client={mockClient(json({ commands: [{ op: 'delete', cardId: 'a' }] }))}>
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'remove write spec');

    expect(await screen.findByText('Delete “Write spec”')).toBeInTheDocument();
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('applies the staged batch once accepted', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider client={mockClient(twoMoves)}>
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'tidy up');
    await user.click(await screen.findByRole('button', { name: 'Apply all changes' }));

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'done')?.cardIds).toEqual(['a', 'b']);
  });

  it('applies only the commands left checked', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider client={mockClient(twoMoves)}>
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'tidy up');
    await user.click(await screen.findByRole('checkbox', { name: 'Move “Fix login bug” to Done' }));
    await user.click(screen.getByRole('button', { name: 'Apply 1 of 2' }));

    const next: KanbanBoardData = onBoardChange.mock.calls.at(-1)?.[0];
    expect(next.columns.find((column) => column.id === 'done')?.cardIds).toEqual(['a']);
  });

  it('discards a staged batch without touching the board', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider client={mockClient(json({ commands: [{ op: 'delete', cardId: 'a' }] }))}>
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'remove write spec');
    await user.click(await screen.findByRole('button', { name: 'Discard' }));

    expect(screen.queryByRole('region', { name: 'Proposed changes' })).not.toBeInTheDocument();
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('reports a hallucinated card id instead of throwing or half-applying', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <AIProvider
        client={mockClient(
          json({ commands: [{ op: 'move', cardId: 'ghost', toColumnId: 'done' }] }),
        )}
      >
        <KanbanBoard defaultBoard={makeBoard()} onBoardChange={onBoardChange} aiPrompt />
      </AIProvider>,
    );

    await ask(user, 'move the ghost card');

    expect(await screen.findByText(/Unknown card "ghost"/)).toBeInTheDocument();
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('validates a consumer resolver the same as the parsed fallback', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        onBoardChange={onBoardChange}
        aiPrompt
        resolveCommands={async () => ({
          commands: [{ op: 'move', cardId: 'ghost', toColumnId: 'done' }],
        })}
      />,
    );

    await ask(user, 'move the ghost card');

    expect(await screen.findByText(/Unknown card "ghost"/)).toBeInTheDocument();
    expect(onBoardChange).not.toHaveBeenCalled();
  });
});

describe('KanbanBoard AI failures', () => {
  it('surfaces a transport error without changing the board', async () => {
    const user = userEvent.setup();
    const onBoardChange = vi.fn();
    render(
      <KanbanBoard
        defaultBoard={makeBoard()}
        onBoardChange={onBoardChange}
        aiPrompt
        resolveCommands={async () => {
          throw new Error('network down');
        }}
      />,
    );

    await ask(user, 'move something');

    expect(await screen.findByRole('alert')).toHaveTextContent('network down');
    expect(onBoardChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations with the prompt bar mounted', async () => {
    const { container } = render(
      <AIProvider client={mockClient('{}')}>
        <KanbanBoard defaultBoard={makeBoard()} aiPrompt aria-label="Sprint" />
      </AIProvider>,
    );

    await expectNoA11yViolations(container);
  });
});
