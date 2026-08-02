import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('renders as a button by default', () => {
    render(<IconButton aria-label="Close" data-testid="icon-button" />);
    expect(screen.getByTestId('icon-button').tagName).toBe('BUTTON');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<IconButton as="a" href="#" aria-label="Close" data-testid="icon-button" />);
    expect(screen.getByTestId('icon-button').tagName).toBe('A');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} aria-label="Close" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className with the base style', () => {
    render(<IconButton aria-label="Close" data-testid="icon-button" className="custom" />);
    expect(screen.getByTestId('icon-button').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <IconButton aria-label="Close">
        <span aria-hidden="true">×</span>
      </IconButton>,
    );
    await expectNoA11yViolations(container);
  });

  it('uses aria-label as its accessible name', () => {
    render(
      <IconButton aria-label="Close">
        <span aria-hidden="true">×</span>
      </IconButton>,
    );
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('defaults to variant=secondary, size=md, shape=square', () => {
    render(<IconButton aria-label="Close" data-testid="icon-button" />);
    const el = screen.getByTestId('icon-button');
    expect(el).toHaveAttribute('data-variant', 'secondary');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-shape', 'square');
  });

  it('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<IconButton aria-label="Close" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled via the native attribute when rendered as a button', () => {
    render(<IconButton aria-label="Close" disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows a spinner and sets aria-busy when loading, hiding children', () => {
    render(
      <IconButton aria-label="Close" loading data-testid="icon-button">
        <span data-testid="icon">×</span>
      </IconButton>,
    );
    const el = screen.getByTestId('icon-button');
    expect(el).toHaveAttribute('aria-busy', 'true');
    expect(el).toHaveAttribute('data-loading', 'true');
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('forces disabled when loading', () => {
    render(<IconButton aria-label="Close" loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
