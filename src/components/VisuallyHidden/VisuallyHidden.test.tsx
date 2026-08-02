import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { VisuallyHidden } from './VisuallyHidden';

describe('VisuallyHidden', () => {
  it('renders as a span by default', () => {
    render(<VisuallyHidden data-testid="hidden">content</VisuallyHidden>);
    expect(screen.getByTestId('hidden').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<VisuallyHidden as="div" data-testid="hidden" />);
    expect(screen.getByTestId('hidden').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<VisuallyHidden ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<VisuallyHidden data-testid="hidden" className="custom" />);
    expect(screen.getByTestId('hidden').className).toContain('custom');
  });

  it('remains present in the DOM (and thus the accessibility tree) rather than being removed', () => {
    render(<VisuallyHidden>Loading, please wait</VisuallyHidden>);
    expect(screen.getByText('Loading, please wait')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<VisuallyHidden>content</VisuallyHidden>);
    await expectNoA11yViolations(container);
  });
});
