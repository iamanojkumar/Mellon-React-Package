import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Display } from './Display';

describe('Display', () => {
  it('renders as a p by default', () => {
    render(<Display data-testid="display">Hero copy</Display>);
    expect(screen.getByTestId('display').tagName).toBe('P');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Display as="h1" data-testid="display" />);
    expect(screen.getByTestId('display').tagName).toBe('H1');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Display ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Display data-testid="display" className="custom" />);
    expect(screen.getByTestId('display').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Display>Hero copy</Display>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md, weight=bold, color=primary', () => {
    render(<Display data-testid="display">content</Display>);
    const el = screen.getByTestId('display');
    expect(el).toHaveAttribute('data-display-size', 'md');
    expect(el).toHaveAttribute('data-weight', 'bold');
    expect(el).toHaveAttribute('data-color', 'primary');
  });

  it('applies the size prop as data-display-size', () => {
    render(
      <Display data-testid="display" size="lg">
        content
      </Display>,
    );
    expect(screen.getByTestId('display')).toHaveAttribute('data-display-size', 'lg');
  });
});
