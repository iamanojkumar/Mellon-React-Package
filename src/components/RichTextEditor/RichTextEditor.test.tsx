import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  // jsdom has no real formatting engine and doesn't even define
  // execCommand/queryCommandState — they're stubbed directly here so
  // toolbar interactions can be asserted deterministically.
  beforeEach(() => {
    document.execCommand = vi.fn().mockReturnValue(true);
    document.queryCommandState = vi.fn().mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).execCommand;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).queryCommandState;
  });

  it('renders a toolbar and an editable textbox', () => {
    render(<RichTextEditor aria-label="Notes" />);
    expect(screen.getByRole('toolbar', { name: 'Text formatting' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBeInTheDocument();
  });

  it('forwards the ref to the editable element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<RichTextEditor aria-label="Notes" ref={ref} />);
    expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Notes' }));
  });

  it('merges a custom className with the root', () => {
    render(<RichTextEditor aria-label="Notes" className="custom" data-testid="rte" />);
    expect(screen.getByTestId('rte').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RichTextEditor aria-label="Notes" />);
    await expectNoA11yViolations(container);
  });

  it('shows the placeholder via data attributes when empty', () => {
    render(<RichTextEditor aria-label="Notes" placeholder="Write something…" />);
    const editable = screen.getByRole('textbox', { name: 'Notes' });
    expect(editable).toHaveAttribute('data-empty');
    expect(editable).toHaveAttribute('data-placeholder', 'Write something…');
  });

  it('works uncontrolled, tracking its own value from defaultValue', () => {
    render(<RichTextEditor aria-label="Notes" defaultValue="<p>hi</p>" />);
    const editable = screen.getByRole('textbox', { name: 'Notes' });
    expect(editable.innerHTML).toBe('<p>hi</p>');
    expect(editable).not.toHaveAttribute('data-empty');
  });

  it('emits onChange with the current innerHTML on input', () => {
    const onChange = vi.fn();
    render(<RichTextEditor aria-label="Notes" onChange={onChange} />);
    const editable = screen.getByRole('textbox', { name: 'Notes' });
    editable.innerHTML = '<p>typed</p>';
    fireEvent.input(editable);
    expect(onChange).toHaveBeenCalledWith('<p>typed</p>');
  });

  it('works controlled, rendering the value prop into the editable surface', () => {
    function Controlled() {
      const [value, setValue] = useState('<p>start</p>');
      return <RichTextEditor aria-label="Notes" value={value} onChange={setValue} />;
    }
    render(<Controlled />);
    expect(screen.getByRole('textbox', { name: 'Notes' }).innerHTML).toBe('<p>start</p>');
  });

  it('disables the editable surface and all toolbar buttons when disabled', () => {
    render(<RichTextEditor aria-label="Notes" disabled />);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveAttribute(
      'contenteditable',
      'false',
    );
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });

  it('calls document.execCommand("bold") when the Bold button is clicked', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor aria-label="Notes" />);
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(document.execCommand).toHaveBeenCalledWith('bold');
  });

  it('calls document.execCommand("insertUnorderedList") when the Bulleted list button is clicked', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor aria-label="Notes" />);
    await user.click(screen.getByRole('button', { name: 'Bulleted list' }));
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList');
  });

  it('opens the link popover, applies the URL via createLink, and closes it', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor aria-label="Notes" />);

    await user.click(screen.getByRole('button', { name: 'Insert link' }));
    const urlInput = screen.getByRole('textbox', { name: 'Link URL' });
    await user.type(urlInput, 'https://example.com');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(document.execCommand).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    expect(screen.queryByRole('textbox', { name: 'Link URL' })).not.toBeInTheDocument();
  });
});
