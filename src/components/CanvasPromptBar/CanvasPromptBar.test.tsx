import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CanvasPromptBar, buildCanvasPromptWithMentions } from './CanvasPromptBar';
import type { CanvasBlockData } from '../../utilities/canvasReducer';

const blocks: CanvasBlockData[] = [
  { id: 'b1', kind: 'sticky', text: 'Login flow', x: 0, y: 0, width: 100, height: 100 },
  { id: 'b2', kind: 'sticky', text: 'Auth service', x: 200, y: 0, width: 100, height: 100 },
];

describe('buildCanvasPromptWithMentions', () => {
  it('returns the prompt untouched when nothing was referenced', () => {
    expect(buildCanvasPromptWithMentions('tidy up', [])).toBe('tidy up');
  });

  it('appends the id behind every reference', () => {
    expect(
      buildCanvasPromptWithMentions('move it', [{ id: 'b2', label: 'Auth service' }]),
    ).toContain('"Auth service" = b2');
  });
});

describe('CanvasPromptBar', () => {
  it('submits the typed prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'add a note{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('add a note');
  });

  it('ignores an empty prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), '   {Enter}');

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens the block picker on @ and filters as you type', async () => {
    const user = userEvent.setup();
    render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'move @auth');

    expect(await screen.findByRole('option', { name: /Auth service/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Login flow/ })).not.toBeInTheDocument();
  });

  it('resolves a picked block to its id in the submitted prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the canvas');
    await user.type(input, 'move @auth');
    await user.click(await screen.findByRole('option', { name: /Auth service/ }));
    await user.type(input, 'left{Enter}');

    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('"Auth service" = b2'));
  });

  it('drops a reference the user deleted from the text', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasPromptBar blocks={blocks} onSubmit={onSubmit} />);

    const input = screen.getByLabelText('Ask or instruct the canvas');
    await user.type(input, '@auth');
    await user.click(await screen.findByRole('option', { name: /Auth service/ }));
    await user.clear(input);
    await user.type(input, 'never mind{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('never mind');
  });

  it('shows a busy state and surfaces errors', () => {
    const { rerender } = render(
      <CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} status="loading" />,
    );
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-busy', 'true');

    rerender(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} error="network down" />);
    expect(screen.getByRole('alert')).toHaveTextContent('network down');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<CanvasPromptBar blocks={blocks} onSubmit={vi.fn()} />);

    await expectNoA11yViolations(container);
  });
});
