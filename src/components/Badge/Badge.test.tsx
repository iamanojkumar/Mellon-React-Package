import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders as a span by default', () => {
    render(<Badge data-testid="badge">New</Badge>);
    expect(screen.getByTestId('badge').tagName).toBe('SPAN');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Badge as="div" data-testid="badge" />);
    expect(screen.getByTestId('badge').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Badge ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Badge data-testid="badge" className="custom" />);
    expect(screen.getByTestId('badge').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Badge>New</Badge>);
    await expectNoA11yViolations(container);
  });

  it('defaults to color=neutral and variant=subtle', () => {
    render(<Badge data-testid="badge">New</Badge>);
    const el = screen.getByTestId('badge');
    expect(el).toHaveAttribute('data-color', 'neutral');
    expect(el).toHaveAttribute('data-variant', 'subtle');
  });

  it('applies the color and variant props as data attributes', () => {
    render(
      <Badge data-testid="badge" color="danger" variant="solid">
        Error
      </Badge>,
    );
    const el = screen.getByTestId('badge');
    expect(el).toHaveAttribute('data-color', 'danger');
    expect(el).toHaveAttribute('data-variant', 'solid');
  });
});
