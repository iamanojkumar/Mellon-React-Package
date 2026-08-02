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
