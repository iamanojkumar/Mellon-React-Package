import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { KanbanPromptBar, buildPromptWithMentions } from './KanbanPromptBar';
import type { KanbanCard } from '../../utilities/kanbanReducer';

const cards: KanbanCard[] = [
  { id: 'c1', title: 'Write spec' },
  { id: 'c2', title: 'Fix login bug' },
];

describe('buildPromptWithMentions', () => {
  it('returns the prompt untouched when nothing was referenced', () => {
    expect(buildPromptWithMentions('move it', [])).toBe('move it');
  });

  it('appends the id behind every reference', () => {
    expect(buildPromptWithMentions('move it', [{ id: 'c2', label: 'Fix login bug' }])).toContain(
      '"Fix login bug" = c2',
    );
  });
});

describe('KanbanPromptBar', () => {
  it('submits the typed prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the board'), 'what is blocked?');
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledWith('what is blocked?');
  });

  it('submits on Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the board'), 'tidy up{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('tidy up');
  });

  it('ignores an empty or whitespace-only prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the board'), '   {Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens the card picker on @ and filters as you type', async () => {
    const user = userEvent.setup();
    render(<KanbanPromptBar cards={cards} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Ask or instruct the board'), 'move @login');

    expect(await screen.findByRole('option', { name: /Fix login bug/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Write spec/ })).not.toBeInTheDocument();
  });

  it('resolves a picked card to its id in the submitted prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the board');
    await user.type(input, 'move @login');
    await user.click(await screen.findByRole('option', { name: /Fix login bug/ }));
    await user.type(input, 'to done{Enter}');

    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('"Fix login bug" = c2'));
  });

  it('drops a reference the user deleted from the text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the board');
    await user.type(input, '@login');
    await user.click(await screen.findByRole('option', { name: /Fix login bug/ }));
    await user.clear(input);
    await user.type(input, 'never mind{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('never mind');
  });

  it('shows a busy state while a request is in flight', () => {
    render(<KanbanPromptBar cards={cards} onSubmit={vi.fn()} status="loading" />);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-busy', 'true');
  });

  it('surfaces an error as an alert', () => {
    render(<KanbanPromptBar cards={cards} onSubmit={vi.fn()} error="network down" />);

    expect(screen.getByRole('alert')).toHaveTextContent('network down');
  });

  it('does not submit when disabled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<KanbanPromptBar cards={cards} onSubmit={onSubmit} disabled />);

    await user.type(screen.getByLabelText('Ask or instruct the board'), 'anything{Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<KanbanPromptBar cards={cards} onSubmit={vi.fn()} />);

    await expectNoA11yViolations(container);
  });
});
