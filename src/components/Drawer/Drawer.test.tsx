import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Drawer } from './Drawer';

function ControlledDrawer(props: {
  onOpenChange?: (open: boolean) => void;
  placement?: 'left' | 'right' | 'top' | 'bottom';
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} data-testid="trigger">
        Open
      </button>
      <Drawer
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        title="Settings"
        placement={props.placement}
      >
        <p>Drawer content</p>
      </Drawer>
    </div>
  );
}

describe('Drawer', () => {
  it('renders nothing when closed', () => {
    render(<Drawer defaultOpen={false} title="Settings" />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with role="dialog", aria-modal, and a labelled title when open', () => {
    render(<Drawer defaultOpen title="Settings" />);
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('has no accessibility violations', async () => {
    render(
      <Drawer defaultOpen title="Settings">
        <p>Content</p>
      </Drawer>,
    );
    await expectNoA11yViolations(document.body);
  });

  it('defaults placement to right', () => {
    render(<Drawer defaultOpen title="Settings" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', 'right');
  });

  it('sets data-placement from the placement prop', () => {
    render(<Drawer defaultOpen title="Settings" placement="bottom" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-placement', 'bottom');
  });

  it('defaults size to md', () => {
    render(<Drawer defaultOpen title="Settings" />);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-size', 'md');
  });

  it('falls back to aria-label when title is omitted', () => {
    render(
      <Drawer defaultOpen aria-label="Settings panel">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Settings panel' })).toBeInTheDocument();
  });

  it('closes on Escape and calls onOpenChange(false)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<ControlledDrawer onOpenChange={onOpenChange} />);
    await user.click(screen.getByTestId('trigger'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on backdrop click but not on a click inside the panel', async () => {
    const user = userEvent.setup();
    render(<ControlledDrawer />);
    await user.click(screen.getByTestId('trigger'));

    await user.click(screen.getByText('Drawer content'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores focus to the trigger when closed', async () => {
    const user = userEvent.setup();
    render(<ControlledDrawer />);
    const trigger = screen.getByTestId('trigger');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(trigger).toHaveFocus();
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer defaultOpen title="Settings" onOpenChange={onOpenChange}>
        <p>Content</p>
      </Drawer>,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders Header/Body/Footer content', () => {
    render(
      <Drawer defaultOpen aria-label="Settings">
        <Drawer.Header>
          <h3>Custom heading</h3>
        </Drawer.Header>
        <Drawer.Body>
          <p>Body content</p>
        </Drawer.Body>
        <Drawer.Footer>
          <button type="button">Save</button>
        </Drawer.Footer>
      </Drawer>,
    );
    expect(screen.getByText('Custom heading')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  describe('bottom-placement grabber (swipe-to-dismiss)', () => {
    // `Drawer` renders via `Portal` into `document.body`, outside whatever
    // container `render()` returns — same reason `screen`/`document`
    // queries are used everywhere else in this file instead of
    // `container.querySelector`. The grabber itself has no ARIA role
    // (it's `aria-hidden`, purely a drag handle), so it's queried by its
    // CSS-module class name substring rather than `screen.getByRole`.
    function getGrabber(): HTMLElement {
      const grabber = document.querySelector<HTMLElement>('[class*="grabber"]');
      if (!grabber) throw new Error('Grabber handle not found');
      return grabber;
    }

    it('renders a grabber handle only for placement="bottom"', () => {
      const { rerender } = render(<Drawer defaultOpen title="Settings" placement="right" />);
      expect(document.querySelector('[class*="grabber"]')).not.toBeInTheDocument();

      rerender(<Drawer defaultOpen title="Settings" placement="bottom" />);
      expect(document.querySelector('[class*="grabber"]')).toBeInTheDocument();
    });

    it('closes when dragged past the dismiss threshold and released', () => {
      const onOpenChange = vi.fn();
      render(
        <Drawer defaultOpen title="Settings" placement="bottom" onOpenChange={onOpenChange} />,
      );
      const grabber = getGrabber();

      fireEvent(grabber, new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
      fireEvent(
        grabber,
        new MouseEvent('pointermove', { bubbles: true, clientX: 0, clientY: 120 }),
      );
      fireEvent(grabber, new MouseEvent('pointerup', { bubbles: true, clientX: 0, clientY: 120 }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('snaps back without closing when dragged less than the dismiss threshold', () => {
      const onOpenChange = vi.fn();
      render(
        <Drawer defaultOpen title="Settings" placement="bottom" onOpenChange={onOpenChange} />,
      );
      const grabber = getGrabber();

      fireEvent(grabber, new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
      fireEvent(grabber, new MouseEvent('pointermove', { bubbles: true, clientX: 0, clientY: 20 }));
      fireEvent(grabber, new MouseEvent('pointerup', { bubbles: true, clientX: 0, clientY: 20 }));

      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('ignores the grabber drag for non-bottom placements', () => {
      const onOpenChange = vi.fn();
      render(<Drawer defaultOpen title="Settings" placement="right" onOpenChange={onOpenChange} />);
      expect(document.querySelector('[class*="grabber"]')).not.toBeInTheDocument();
    });
  });
});
