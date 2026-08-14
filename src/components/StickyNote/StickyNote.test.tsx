import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { StickyNote } from './StickyNote';

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
});
