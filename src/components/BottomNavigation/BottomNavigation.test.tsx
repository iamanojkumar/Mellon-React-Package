import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { BottomNavigation } from './BottomNavigation';

const dot = <span data-testid="icon" />;

function BasicBottomNav() {
  return (
    <BottomNavigation>
      <BottomNavigation.Item href="/" icon={dot} active>
        Home
      </BottomNavigation.Item>
      <BottomNavigation.Item href="/search" icon={dot}>
        Search
      </BottomNavigation.Item>
      <BottomNavigation.Item href="/profile" icon={dot} badge={<span data-testid="badge">3</span>}>
        Profile
      </BottomNavigation.Item>
    </BottomNavigation>
  );
}

describe('BottomNavigation', () => {
  it('renders a nav landmark labelled "Bottom Navigation" by default', () => {
    render(<BasicBottomNav />);
    expect(screen.getByRole('navigation', { name: 'Bottom Navigation' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(
      <BottomNavigation aria-label="App sections">
        <BottomNavigation.Item href="/" icon={dot}>
          Home
        </BottomNavigation.Item>
      </BottomNavigation>,
    );
    expect(screen.getByRole('navigation', { name: 'App sections' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current', () => {
    render(<BasicBottomNav />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Search' })).not.toHaveAttribute('aria-current');
  });

  it('renders badge content', () => {
    render(<BasicBottomNav />);
    expect(screen.getByTestId('badge')).toBeInTheDocument();
  });

  it('moves focus with ArrowRight/ArrowLeft, wrapping', async () => {
    const user = userEvent.setup();
    render(<BasicBottomNav />);
    screen.getByRole('link', { name: 'Home' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: 'Search' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();
  });

  it('moves to the first/last item with Home/End', async () => {
    const user = userEvent.setup();
    render(<BasicBottomNav />);
    screen.getByRole('link', { name: 'Search' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('link', { name: /Profile/ })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicBottomNav />);
    await expectNoA11yViolations(container);
  });
});
