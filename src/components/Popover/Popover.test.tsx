import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Popover } from './Popover';

function ClickPopover() {
  return (
    <Popover>
      <Popover.Trigger>Open</Popover.Trigger>
      <Popover.Content>Popover content</Popover.Content>
    </Popover>
  );
}

function HoverPopover({ closeDelay = 20 }: { closeDelay?: number }) {
  return (
    <Popover triggerMode="hover" closeDelay={closeDelay}>
      <Popover.Trigger>Hover me</Popover.Trigger>
      <Popover.Content>Hover content</Popover.Content>
    </Popover>
  );
}

describe('Popover', () => {
  it('is closed by default and has no content in the document', () => {
    render(<ClickPopover />);
    expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(<ClickPopover />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await expectNoA11yViolations(document.body);
  });

  it('throws when a Popover part is used outside <Popover>', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Popover.Trigger>content</Popover.Trigger>)).toThrow(
      '<Popover.Trigger> must be used within <Popover>',
    );
    consoleError.mockRestore();
  });

  describe('click trigger mode (default)', () => {
    it('opens on trigger click and toggles closed on a second click', async () => {
      const user = userEvent.setup();
      render(<ClickPopover />);
      const trigger = screen.getByRole('button', { name: 'Open' });

      await user.click(trigger);
      expect(screen.getByText('Popover content')).toBeInTheDocument();
      expect(trigger).toHaveAttribute('aria-expanded', 'true');

      await user.click(trigger);
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });

    it('closes on Escape', async () => {
      const user = userEvent.setup();
      render(<ClickPopover />);
      await user.click(screen.getByRole('button', { name: 'Open' }));
      await user.keyboard('{Escape}');
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });

    it('closes on an outside click but not on a click on the trigger itself', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <ClickPopover />
          <button type="button">elsewhere</button>
        </div>,
      );
      const trigger = screen.getByRole('button', { name: 'Open' });
      await user.click(trigger);
      expect(screen.getByText('Popover content')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'elsewhere' }));
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });

    it('does not open on hover in click mode', async () => {
      const user = userEvent.setup();
      render(<ClickPopover />);
      await user.hover(screen.getByRole('button', { name: 'Open' }));
      expect(screen.queryByText('Popover content')).not.toBeInTheDocument();
    });
  });

  describe('hover trigger mode', () => {
    it('opens immediately on pointer hover and stays open while hovered', async () => {
      const user = userEvent.setup();
      render(<HoverPopover />);
      await user.hover(screen.getByRole('button', { name: 'Hover me' }));
      expect(screen.getByText('Hover content')).toBeInTheDocument();
    });

    it('opens on keyboard focus, the equivalent of hover', () => {
      render(<HoverPopover />);
      fireEvent.focus(screen.getByRole('button', { name: 'Hover me' }));
      expect(screen.getByText('Hover content')).toBeInTheDocument();
    });

    it('closes closeDelay ms after the pointer leaves the trigger', async () => {
      // A generous delay relative to userEvent's own dispatch overhead, so
      // the "still open immediately after leaving" check below isn't racing
      // the timer under a loaded test run (this suite runs alongside many
      // other test files).
      const closeDelay = 300;
      const user = userEvent.setup();
      render(<HoverPopover closeDelay={closeDelay} />);
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);
      expect(screen.getByText('Hover content')).toBeInTheDocument();

      await user.unhover(trigger);
      // still open immediately after leaving - the close is scheduled, not instant
      expect(screen.getByText('Hover content')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByText('Hover content')).not.toBeInTheDocument();
        },
        { timeout: closeDelay + 1000 },
      );
    });

    it('moving the pointer from the trigger into the content cancels the scheduled close', async () => {
      // A generous delay relative to userEvent's own dispatch overhead
      // between the unhover/hover below, so this isn't racing the timer.
      const closeDelay = 300;
      const user = userEvent.setup();
      render(<HoverPopover closeDelay={closeDelay} />);
      const trigger = screen.getByRole('button', { name: 'Hover me' });
      await user.hover(trigger);
      const content = screen.getByText('Hover content');

      await user.unhover(trigger);
      await user.hover(content);

      // wait past the original close-delay window; the timer should have been cancelled by hovering the content
      await new Promise((resolve) => setTimeout(resolve, closeDelay + 50));
      expect(screen.getByText('Hover content')).toBeInTheDocument();
    });
  });
});
