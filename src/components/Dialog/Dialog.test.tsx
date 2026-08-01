import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Dialog } from './Dialog';

function ControlledDialog(props: { onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} data-testid="trigger">
        Open
      </button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        title="Confirm"
      >
        <p>Are you sure?</p>
        <button type="button" onClick={() => setOpen(false)}>
          Confirm
        </button>
      </Dialog>
    </div>
  );
}

describe('Dialog', () => {
  it('renders nothing when closed', () => {
    render(<Dialog defaultOpen={false} title="Title" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with role="dialog", aria-modal, and a labelled title when open', () => {
    render(<Dialog defaultOpen title="Confirm" />);
    const dialog = screen.getByRole('dialog', { name: 'Confirm' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has no accessibility violations', async () => {
    render(
      <Dialog defaultOpen title="Confirm">
        <p>Content</p>
      </Dialog>,
    );
    await expectNoA11yViolations(document.body);
  });

  it('focuses into the dialog on open, synchronously with the first render', () => {
    render(
      <Dialog defaultOpen title="Confirm">
        <button type="button">First</button>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('closes on Escape and calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDialog onOpenChange={onOpenChange} />);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click but not on a click inside the panel', async () => {
    const user = userEvent.setup();
    render(<ControlledDialog />);
    await user.click(screen.getByTestId('trigger'));

    await user.click(screen.getByText('Are you sure?'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // click the backdrop itself (outside the panel)
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores focus to the trigger when closed', async () => {
    const user = userEvent.setup();
    render(<ControlledDialog />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });
});
