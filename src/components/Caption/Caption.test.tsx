import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Caption } from './Caption';

describe('Caption', () => {
  it('renders as a span by default', () => {
    render(<Caption data-testid="caption">content</Caption>);
    expect(screen.getByTestId('caption').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Caption as="figcaption" data-testid="caption" />);
    expect(screen.getByTestId('caption').tagName).toBe('FIGCAPTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Caption ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Caption data-testid="caption" className="custom" />);
    expect(screen.getByTestId('caption').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Caption>content</Caption>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=xs and color=secondary', () => {
    render(<Caption data-testid="caption">content</Caption>);
    const el = screen.getByTestId('caption');
    expect(el).toHaveAttribute('data-size', 'xs');
    expect(el).toHaveAttribute('data-color', 'secondary');
  });
});
