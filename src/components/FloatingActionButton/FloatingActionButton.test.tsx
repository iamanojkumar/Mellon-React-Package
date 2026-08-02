import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FloatingActionButton } from './FloatingActionButton';

describe('FloatingActionButton', () => {
  it('renders as a button by default', () => {
    render(<FloatingActionButton aria-label="Add" data-testid="fab" />);
    expect(screen.getByTestId('fab').tagName).toBe('BUTTON');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<FloatingActionButton as="a" href="#" aria-label="Add" data-testid="fab" />);
    expect(screen.getByTestId('fab').tagName).toBe('A');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<FloatingActionButton ref={ref} aria-label="Add" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className with the base style', () => {
    render(<FloatingActionButton aria-label="Add" data-testid="fab" className="custom" />);
    expect(screen.getByTestId('fab').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <FloatingActionButton aria-label="Add">
        <span aria-hidden="true">+</span>
      </FloatingActionButton>,
    );
    await expectNoA11yViolations(container);
  });

  it('uses aria-label as its accessible name', () => {
    render(
      <FloatingActionButton aria-label="Add">
        <span aria-hidden="true">+</span>
      </FloatingActionButton>,
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('defaults to variant=primary, size=lg, and not fixed', () => {
    render(<FloatingActionButton aria-label="Add" data-testid="fab" />);
    const el = screen.getByTestId('fab');
    expect(el).toHaveAttribute('data-variant', 'primary');
    expect(el).toHaveAttribute('data-size', 'lg');
    expect(el).not.toHaveAttribute('data-fixed');
  });

  it('sets data-fixed when fixed is true', () => {
    render(<FloatingActionButton aria-label="Add" fixed data-testid="fab" />);
    expect(screen.getByTestId('fab')).toHaveAttribute('data-fixed', 'true');
  });

  it('calls onClick when activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<FloatingActionButton aria-label="Add" onClick={onClick} />);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('forces disabled when loading', () => {
    render(<FloatingActionButton aria-label="Add" loading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
