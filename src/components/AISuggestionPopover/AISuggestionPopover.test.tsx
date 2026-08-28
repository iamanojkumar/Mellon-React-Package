import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { AISuggestionPopover } from './AISuggestionPopover';

describe('AISuggestionPopover', () => {
  it('is closed by default', () => {
    render(<AISuggestionPopover triggerLabel="Rewrite with AI" status="idle" result="" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on trigger click', async () => {
    const user = userEvent.setup();
    render(<AISuggestionPopover triggerLabel="Rewrite with AI" status="idle" result="" />);
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders result text while loading/streaming/done', () => {
    // `defaultOpen` here, not a click — the trigger button is disabled
    // while `status="streaming"` (see AITriggerButton), same as it would
    // be mid-request in real usage; the popover is already open by then.
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="streaming"
        result="Partial suggestion..."
        defaultOpen
      />,
    );
    expect(screen.getByText('Partial suggestion...')).toBeInTheDocument();
  });

  it('renders the error message and a Retry button when status is error', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="error"
        result=""
        error="Something went wrong"
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows Accept/Discard only when done and calls them with the result', async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onReject = vi.fn();
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="done"
        result="Rewritten text"
        onAccept={onAccept}
        onReject={onReject}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    expect(screen.getByText('Rewritten text')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledWith('Rewritten text');

    await user.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('hides the actions row when neither onAccept nor onReject is given', async () => {
    const user = userEvent.setup();
    render(
      <AISuggestionPopover triggerLabel="Explain with AI" status="done" result="Explanation" />,
    );
    await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
  });

  it('without editablePrompt, opening never shows a prompt form', async () => {
    const user = userEvent.setup();
    render(<AISuggestionPopover triggerLabel="Rewrite with AI" status="idle" result="" />);
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('editablePrompt: opens showing a textarea pre-filled with it, instead of fetching immediately', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="idle"
        result=""
        editablePrompt="Rewrite this note to be clearer."
        onSubmit={vi.fn()}
        onOpenChange={onOpenChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    const textarea = screen.getByRole('textbox', { name: 'Instruction' });
    expect(textarea).toHaveValue('Rewrite this note to be clearer.');
    // onOpenChange still fires — the popover doesn't swallow it, only adds
    // its own draft-reset behaviour on top.
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('editablePrompt: submits the edited text via onSubmit, not the original', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="idle"
        result=""
        editablePrompt="Original instruction"
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    const textarea = screen.getByRole('textbox', { name: 'Instruction' });
    await user.clear(textarea);
    await user.type(textarea, 'Make it punchier');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith('Make it punchier');
  });

  it('editablePrompt: the form gives way to the result once status leaves idle', () => {
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="streaming"
        result="Partial..."
        editablePrompt="Original instruction"
        onSubmit={vi.fn()}
        defaultOpen
      />,
    );
    expect(screen.queryByRole('textbox', { name: 'Instruction' })).not.toBeInTheDocument();
    expect(screen.getByText('Partial...')).toBeInTheDocument();
  });

  it('has no accessibility violations with the editable prompt form open', async () => {
    const user = userEvent.setup();
    render(
      <AISuggestionPopover
        triggerLabel="Rewrite with AI"
        status="idle"
        result=""
        editablePrompt="Original instruction"
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    await expectNoA11yViolations(document.body);
  });

  it('has no accessibility violations closed or open', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AISuggestionPopover triggerLabel="Rewrite with AI" status="done" result="Rewritten text" />,
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('button', { name: 'Rewrite with AI' }));
    await expectNoA11yViolations(document.body);
  });
});
