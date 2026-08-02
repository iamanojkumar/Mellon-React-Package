import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { NavigationRail } from './NavigationRail';

const dot = <span data-testid="icon" />;

function BasicRail() {
  return (
    <NavigationRail>
      <NavigationRail.Item href="/" icon={dot} active>
        Home
      </NavigationRail.Item>
      <NavigationRail.Item href="/search" icon={dot}>
        Search
      </NavigationRail.Item>
      <NavigationRail.Item href="/profile" icon={dot} badge={<span data-testid="badge">3</span>}>
        Profile
      </NavigationRail.Item>
    </NavigationRail>
  );
}

describe('NavigationRail', () => {
  it('renders a nav landmark labelled "Navigation" by default', () => {
    render(<BasicRail />);
    expect(screen.getByRole('navigation', { name: 'Navigation' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(
      <NavigationRail aria-label="App sections">
        <NavigationRail.Item href="/" icon={dot}>
          Home
        </NavigationRail.Item>
      </NavigationRail>,
    );
    expect(screen.getByRole('navigation', { name: 'App sections' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current', () => {
    render(<BasicRail />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
  });

  it('renders badge content', () => {
    render(<BasicRail />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('every item stays individually tabbable (no roving-tabindex Tab restriction)', () => {
    render(<BasicRail />);
    for (const name of ['Home', 'Search', 'Profile']) {
      expect(screen.getByRole('link', { name: new RegExp(name) })).not.toHaveAttribute(
        'tabindex',
        '-1',
      );
    }
  });

  it('moves focus with ArrowDown/ArrowUp, wrapping', async () => {
    const user = userEvent.setup();
    render(<BasicRail />);
    screen.getByRole('link', { name: 'Home' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Search' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();
  });

  it('moves to the first/last item with Home/End', async () => {
    const user = userEvent.setup();
    render(<BasicRail />);
    screen.getByRole('link', { name: 'Search' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicRail />);
    await expectNoA11yViolations(container);
  });
});
