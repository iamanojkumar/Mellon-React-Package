import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { HoverCard } from './HoverCard';

function BasicHoverCard(props: { closeDelay?: number }) {
  return (
    <HoverCard closeDelay={props.closeDelay}>
      <HoverCard.Trigger as="a" href="#profile">
        @ada
      </HoverCard.Trigger>
      <HoverCard.Content>
        <p>Ada Lovelace — mathematician</p>
      </HoverCard.Content>
    </HoverCard>
  );
}

describe('HoverCard', () => {
  it('is closed by default', () => {
    render(<BasicHoverCard />);
    expect(screen.queryByText('Ada Lovelace — mathematician')).not.toBeInTheDocument();
  });

  it('opens on hover, unlike Popover default click mode', async () => {
    const user = userEvent.setup();
    render(<BasicHoverCard />);
    await user.hover(screen.getByRole('link', { name: '@ada' }));
    expect(screen.getByText('Ada Lovelace — mathematician')).toBeInTheDocument();
  });

  it('opens on keyboard focus', () => {
    render(<BasicHoverCard />);
    fireEvent.focus(screen.getByRole('link', { name: '@ada' }));
    expect(screen.getByText('Ada Lovelace — mathematician')).toBeInTheDocument();
  });

  it('has no accessibility violations when open', async () => {
    const user = userEvent.setup();
    render(<BasicHoverCard />);
    await user.hover(screen.getByRole('link', { name: '@ada' }));
    await expectNoA11yViolations(document.body);
  });

  it('closes closeDelay ms after the pointer leaves', async () => {
    const closeDelay = 300;
    const user = userEvent.setup();
    render(<BasicHoverCard closeDelay={closeDelay} />);
    const trigger = screen.getByRole('link', { name: '@ada' });
    await user.hover(trigger);
    expect(screen.getByText('Ada Lovelace — mathematician')).toBeInTheDocument();

    await user.unhover(trigger);
    expect(screen.getByText('Ada Lovelace — mathematician')).toBeInTheDocument();

    await waitFor(
      () => {
        expect(screen.queryByText('Ada Lovelace — mathematician')).not.toBeInTheDocument();
      },
      { timeout: closeDelay + 1000 },
    );
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicHoverCard />);
    await user.hover(screen.getByRole('link', { name: '@ada' }));
    expect(screen.getByText('Ada Lovelace — mathematician')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Ada Lovelace — mathematician')).not.toBeInTheDocument();
  });

  it("uses the trigger's correct popup ARIA wiring (aria-haspopup/aria-expanded), unlike Tooltip", async () => {
    const user = userEvent.setup();
    render(<BasicHoverCard />);
    const trigger = screen.getByRole('link', { name: '@ada' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.hover(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
