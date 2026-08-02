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

  it('focuses the close button on open by default (it is the first focusable element)', () => {
    render(
      <Dialog defaultOpen title="Confirm">
        <button type="button">First</button>
      </Dialog>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('focuses into the dialog on open, synchronously with the first render, when there is no close button', () => {
    render(
      <Dialog defaultOpen title="Confirm" showCloseButton={false}>
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

  describe('close button', () => {
    it('closes the dialog when clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Dialog defaultOpen title="Confirm" onOpenChange={onOpenChange}>
          <p>Content</p>
        </Dialog>,
      );
      await user.click(screen.getByRole('button', { name: 'Close' }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('is omitted when showCloseButton is false', () => {
      render(
        <Dialog defaultOpen title="Confirm" showCloseButton={false}>
          <p>Content</p>
        </Dialog>,
      );
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    });

    it('supports a custom closeLabel', () => {
      render(
        <Dialog defaultOpen title="Confirm" closeLabel="Dismiss">
          <p>Content</p>
        </Dialog>,
      );
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });
  });

  describe('size', () => {
    it('defaults to size=md', () => {
      render(<Dialog defaultOpen title="Confirm" />);
      expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'md');
    });

    it('sets data-size from the size prop', () => {
      render(<Dialog defaultOpen title="Confirm" size="full" />);
      expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'full');
    });
  });

  describe('labelling without title', () => {
    it('falls back to aria-label when title is omitted', () => {
      render(
        <Dialog defaultOpen aria-label="Settings">
          <p>Content</p>
        </Dialog>,
      );
      expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    });

    it('does not render an h2 when title is omitted', () => {
      render(
        <Dialog defaultOpen aria-label="Settings">
          <p>Content</p>
        </Dialog>,
      );
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
  });

  describe('compound parts', () => {
    it('renders Header/Body/Footer content', () => {
      render(
        <Dialog defaultOpen aria-label="Settings">
          <Dialog.Header>
            <h3>Custom heading</h3>
          </Dialog.Header>
          <Dialog.Body>
            <p>Body content</p>
          </Dialog.Body>
          <Dialog.Footer>
            <button type="button">Save</button>
          </Dialog.Footer>
        </Dialog>,
      );
      expect(screen.getByText('Custom heading')).toBeInTheDocument();
      expect(screen.getByText('Body content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('has no accessibility violations when using Header/Body/Footer', async () => {
      render(
        <Dialog defaultOpen aria-label="Settings">
          <Dialog.Header>
            <h3>Custom heading</h3>
          </Dialog.Header>
          <Dialog.Body>
            <p>Body content</p>
          </Dialog.Body>
          <Dialog.Footer>
            <button type="button">Save</button>
          </Dialog.Footer>
        </Dialog>,
      );
      await expectNoA11yViolations(document.body);
    });
  });
});
