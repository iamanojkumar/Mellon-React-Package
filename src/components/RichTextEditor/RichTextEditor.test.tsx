import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { RichTextEditor } from './RichTextEditor';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

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
  describe('aiRewrite', () => {
    it('renders no AI trigger when aiRewrite is omitted', () => {
      render(<RichTextEditor aria-label="Notes" />);
      expect(screen.queryByRole('button', { name: 'Rewrite with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiRewrite is true but no AIProvider is mounted', () => {
      render(<RichTextEditor aria-label="Notes" aiRewrite />);
      expect(screen.queryByRole('button', { name: 'Rewrite with AI' })).not.toBeInTheDocument();
    });

    it('renders markup identical to the non-AI editor when there is no AIProvider', () => {
      // `useId` counts up across the whole test file, so the two renders can
      // never produce the same generated ids — everything else must match.
      const withoutIds = (html: string) => html.replace(/_r_[^_"]*_/g, 'ID');

      const plain = render(<RichTextEditor aria-label="Notes" defaultValue="<p>hi</p>" />);
      const plainHtml = withoutIds(plain.container.innerHTML);
      plain.unmount();

      const withProp = render(
        <RichTextEditor aria-label="Notes" aiRewrite defaultValue="<p>hi</p>" />,
      );
      expect(withoutIds(withProp.container.innerHTML)).toBe(plainHtml);
    });

    it('renders no AI trigger when the editor is read-only or disabled', () => {
      const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
      render(
        <AIProvider client={client}>
          <RichTextEditor aria-label="Notes" aiRewrite readOnly />
        </AIProvider>,
      );
      expect(screen.queryByRole('button', { name: 'Rewrite with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when aiRewrite is true and an AIProvider is mounted', () => {
      const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
      render(
        <AIProvider client={client}>
          <RichTextEditor aria-label="Notes" aiRewrite />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Rewrite with AI' })).toBeInTheDocument();
    });

    it('keeps the formatting toolbar a single tab stop with the AI trigger beside it', () => {
      const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
      render(
        <AIProvider client={client}>
          <RichTextEditor aria-label="Notes" aiRewrite />
        </AIProvider>,
      );
      const trigger = screen.getByRole('button', { name: 'Rewrite with AI' });
      expect(screen.getByRole('toolbar')).not.toContainElement(trigger);
    });

    it('prompts with the current HTML and applies the accepted result as the new value', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('<p>A <b>polished</b> draft</p>'),
      };
      const onChange = vi.fn();

      render(
        <AIProvider client={client}>
          <RichTextEditor
            aria-label="Notes"
            aiRewrite
            defaultValue="<p>a draft</p>"
            onChange={onChange}
          />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('<p>a draft</p>') }),
      );

      await screen.findByText('<p>A <b>polished</b> draft</p>');
      await user.click(screen.getByRole('button', { name: 'Accept' }));

      expect(onChange).toHaveBeenCalledWith('<p>A <b>polished</b> draft</p>');
      // The DOM, not React, owns the editable's children — accepting has to
      // reach it through the same "changed from outside" effect a controlled
      // value update takes, or the visible content would go stale.
      expect(screen.getByRole('textbox', { name: 'Notes' }).innerHTML).toBe(
        '<p>A <b>polished</b> draft</p>',
      );
    });

    it('reports open/accept to the analytics callbacks', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('<p>better</p>') };
      const onAIOpenChange = vi.fn();
      const onAIAccept = vi.fn();

      render(
        <AIProvider client={client}>
          <RichTextEditor
            aria-label="Notes"
            aiRewrite
            defaultValue="<p>draft</p>"
            onAIOpenChange={onAIOpenChange}
            onAIAccept={onAIAccept}
          />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      expect(onAIOpenChange).toHaveBeenCalledWith(true);

      await screen.findByText('<p>better</p>');
      await user.click(screen.getByRole('button', { name: 'Accept' }));
      expect(onAIAccept).toHaveBeenCalledWith('<p>better</p>');
    });

    it('reports a discarded suggestion and leaves the value alone', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('<p>better</p>') };
      const onAIReject = vi.fn();
      const onChange = vi.fn();

      render(
        <AIProvider client={client}>
          <RichTextEditor
            aria-label="Notes"
            aiRewrite
            defaultValue="<p>draft</p>"
            onChange={onChange}
            onAIReject={onAIReject}
          />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
      await screen.findByText('<p>better</p>');
      await user.click(screen.getByRole('button', { name: 'Discard' }));

      expect(onAIReject).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn().mockResolvedValue('x') };
      const { container } = render(
        <AIProvider client={client}>
          <RichTextEditor aria-label="Notes" aiRewrite defaultValue="<p>draft</p>" />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
