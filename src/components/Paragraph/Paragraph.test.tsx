import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Paragraph } from './Paragraph';

describe('Paragraph', () => {
  it('renders as a p by default', () => {
    render(<Paragraph data-testid="paragraph">content</Paragraph>);
    expect(screen.getByTestId('paragraph').tagName).toBe('P');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Paragraph as="div" data-testid="paragraph" />);
    expect(screen.getByTestId('paragraph').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Paragraph ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Paragraph data-testid="paragraph" className="custom" />);
    expect(screen.getByTestId('paragraph').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Paragraph>content</Paragraph>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md, weight=regular, color=primary', () => {
    render(<Paragraph data-testid="paragraph">content</Paragraph>);
    const el = screen.getByTestId('paragraph');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-weight', 'regular');
    expect(el).toHaveAttribute('data-color', 'primary');
  });
});
