import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { StickyNote } from './StickyNote';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('StickyNote', () => {
  it('renders its text', () => {
    render(<StickyNote text="Ship the release" />);

    expect(screen.getByText('Ship the release')).toBeInTheDocument();
  });

  it('preserves line breaks rather than collapsing them', () => {
    const { container } = render(<StickyNote text={'one\ntwo'} />);

    expect(container.querySelector('p')).toHaveTextContent('one two');
    expect(container.querySelector('p')).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('exposes tone as a data attribute, not as the only signal', () => {
    const { container } = render(<StickyNote text="At risk" tone="warning" />);

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'warning');
    // The meaning is in the text; the tone is decoration.
    expect(screen.getByText('At risk')).toBeInTheDocument();
  });

  it('swaps to a labelled textarea when editing', () => {
    render(<StickyNote text="Draft" editing />);

    expect(screen.getByLabelText('Note text')).toHaveValue('Draft');
  });

  it('focuses the textarea with the caret at the end', () => {
    render(<StickyNote text="Draft" editing />);
    const textarea = screen.getByLabelText('Note text') as HTMLTextAreaElement;

    expect(textarea).toHaveFocus();
    expect(textarea.selectionStart).toBe('Draft'.length);
  });

  it('reports every keystroke', async () => {
    const user = userEvent.setup();
    const onTextChange = vi.fn();
    render(<StickyNote text="" editing onTextChange={onTextChange} />);

    await user.type(screen.getByLabelText('Note text'), 'hi');

    expect(onTextChange).toHaveBeenCalled();
  });

  it('ends editing on Escape and on blur', async () => {
    const user = userEvent.setup();
    const onEditingEnd = vi.fn();
    render(<StickyNote text="Draft" editing onEditingEnd={onEditingEnd} />);

    await user.keyboard('{Escape}');
    expect(onEditingEnd).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(onEditingEnd).toHaveBeenCalledTimes(2);
  });

  it('keeps Enter for new lines and uses Ctrl+Enter to finish', async () => {
    const user = userEvent.setup();
    const onEditingEnd = vi.fn();
    render(<StickyNote text="Draft" editing onEditingEnd={onEditingEnd} />);

    await user.keyboard('{Enter}');
    expect(onEditingEnd).not.toHaveBeenCalled();

    await user.keyboard('{Control>}{Enter}{/Control}');
    expect(onEditingEnd).toHaveBeenCalled();
  });

  it('has no accessibility violations in either state', async () => {
    const read = render(<StickyNote text="Ship it" />);
    await expectNoA11yViolations(read.container);
    read.unmount();

    const write = render(<StickyNote text="Ship it" editing />);
    await expectNoA11yViolations(write.container);
  });

  describe('aiRewrite', () => {
    it('renders no AI trigger when aiRewrite is omitted', () => {
      render(<StickyNote text="Ship it" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiRewrite is true but no AIProvider is mounted', () => {
      render(<StickyNote text="Ship it" aiRewrite onTextChange={vi.fn()} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('fetch-on-open (default): triggers the client immediately, no textarea shown', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('a tighter note') };

      function Controlled() {
        const [text, setText] = useState('a draft note');
        return (
          <AIProvider client={client}>
            <StickyNote text={text} aiRewrite onTextChange={setText} />
          </AIProvider>
        );
      }
      render(<Controlled />);

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('a draft note') }),
      );
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      await screen.findByText('a tighter note');
      await user.click(screen.getByRole('button', { name: 'Accept' }));
      expect(screen.getByText('a tighter note')).toBeInTheDocument();
    });

    it('aiRewriteEditable: opens with an editable textarea instead of fetching immediately', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('unused') };
      render(
        <AIProvider client={client}>
          <StickyNote text="a draft note" aiRewrite aiRewriteEditable onTextChange={vi.fn()} />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      const textarea = screen.getByRole('textbox', { name: 'Instruction' }) as HTMLTextAreaElement;
      expect(textarea.value).toContain('a draft note');
      expect(client.complete).not.toHaveBeenCalled();
    });

    it('aiRewriteEditable: sends the edited instruction, not the default prompt', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('rewritten') };
      render(
        <AIProvider client={client}>
          <StickyNote text="a draft note" aiRewrite aiRewriteEditable onTextChange={vi.fn()} />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      const textarea = screen.getByRole('textbox', { name: 'Instruction' });
      await user.clear(textarea);
      await user.type(textarea, 'Make it punchier');
      await user.click(screen.getByRole('button', { name: 'Send' }));

      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Make it punchier' }),
      );
    });
  });
});
