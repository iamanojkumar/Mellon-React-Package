import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Blockquote } from './Blockquote';

describe('Blockquote', () => {
  it('renders as a blockquote by default', () => {
    render(<Blockquote data-testid="quote">content</Blockquote>);
    expect(screen.getByTestId('quote').tagName).toBe('BLOCKQUOTE');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Blockquote as="div" data-testid="quote" />);
    expect(screen.getByTestId('quote').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLQuoteElement>();
    render(<Blockquote ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLQuoteElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Blockquote data-testid="quote" className="custom" />);
    expect(screen.getByTestId('quote').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Blockquote>content</Blockquote>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md and color=secondary', () => {
    render(<Blockquote data-testid="quote">content</Blockquote>);
    const el = screen.getByTestId('quote');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-color', 'secondary');
  });
});
