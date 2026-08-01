import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from '../hooks/useTheme';

function ThemeConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <button type="button" onClick={() => setTheme('dark')}>
      {theme}
    </button>
  );
}

describe('ThemeProvider', () => {
  it('renders children', () => {
    render(
      <ThemeProvider>
        <span data-testid="child">content</span>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies data-theme to document.documentElement by default', () => {
    const { unmount } = render(
      <ThemeProvider defaultTheme="dark">
        <span />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('applies data-theme to a custom target element', () => {
    const target = document.createElement('div');
    render(
      <ThemeProvider defaultTheme="high-contrast" target={target}>
        <span />
      </ThemeProvider>,
    );
    expect(target).toHaveAttribute('data-theme', 'high-contrast');
    expect(document.documentElement).not.toHaveAttribute('data-theme');
  });

  it('updates the applied theme when setTheme is called', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    await user.click(screen.getByRole('button'));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(screen.getByRole('button')).toHaveTextContent('dark');
  });

  it('useTheme throws when used outside a ThemeProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider');
    consoleError.mockRestore();
  });
});
