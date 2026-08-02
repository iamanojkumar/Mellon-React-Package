import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders as a div by default', () => {
    render(<Divider data-testid="divider" />);
    expect(screen.getByTestId('divider').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Divider as="hr" data-testid="divider" />);
    expect(screen.getByTestId('divider').tagName).toBe('HR');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Divider ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Divider data-testid="divider" className="custom" />);
    expect(screen.getByTestId('divider').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Divider />);
    await expectNoA11yViolations(container);
  });

  it('defaults to a horizontal separator', () => {
    render(<Divider data-testid="divider" />);
    const divider = screen.getByRole('separator');
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByTestId('divider')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('applies the vertical orientation', () => {
    render(<Divider orientation="vertical" data-testid="divider" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByTestId('divider')).toHaveAttribute('data-orientation', 'vertical');
  });
});
