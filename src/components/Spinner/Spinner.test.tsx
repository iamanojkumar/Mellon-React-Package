import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders as a span', () => {
    render(<Spinner data-testid="spinner" />);
    expect(screen.getByTestId('spinner').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Spinner data-testid="spinner" className="custom" />);
    expect(screen.getByTestId('spinner').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Spinner />);
    await expectNoA11yViolations(container);
  });

  it('has role="status" with a default accessible label of "Loading"', () => {
    render(<Spinner />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('uses a custom label', () => {
    render(<Spinner label="Fetching results" />);
    expect(screen.getByRole('status', { name: 'Fetching results' })).toBeInTheDocument();
  });

  it('defaults to size=md', () => {
    render(<Spinner data-testid="spinner" />);
    expect(screen.getByTestId('spinner')).toHaveAttribute('data-size', 'md');
  });
});
