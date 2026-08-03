import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TokenCounter } from './TokenCounter';

describe('TokenCounter', () => {
  it('estimates ~4 characters per token by default', () => {
    render(<TokenCounter value="12345678" data-testid="counter" />);
    expect(screen.getByTestId('counter')).toHaveTextContent('2');
  });

  it('renders 0 for an empty value', () => {
    render(<TokenCounter value="" data-testid="counter" />);
    expect(screen.getByTestId('counter')).toHaveTextContent('0');
  });

  it('supports a custom estimator', () => {
    render(<TokenCounter value="hello world" estimateTokens={(text) => text.split(' ').length} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders "count / limit" when limit is given', () => {
    render(<TokenCounter value="12345678" limit={100} />);
    expect(screen.getByText('2 / 100')).toBeInTheDocument();
  });

  it('sets data-over-limit once the count exceeds limit', () => {
    render(<TokenCounter value={'a'.repeat(40)} limit={5} data-testid="counter" />);
    expect(screen.getByTestId('counter')).toHaveAttribute('data-over-limit');
  });

  it('does not set data-over-limit when at or under limit', () => {
    render(<TokenCounter value="12345678" limit={2} data-testid="counter" />);
    expect(screen.getByTestId('counter')).not.toHaveAttribute('data-over-limit');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<TokenCounter ref={ref} value="" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<TokenCounter value="" className="custom" data-testid="counter" />);
    expect(screen.getByTestId('counter').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TokenCounter value="hello" limit={10} />);
    await expectNoA11yViolations(container);
  });
});
