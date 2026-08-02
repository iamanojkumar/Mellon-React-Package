import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { AspectRatio } from './AspectRatio';

describe('AspectRatio', () => {
  it('renders as a div by default', () => {
    render(<AspectRatio data-testid="ratio">content</AspectRatio>);
    expect(screen.getByTestId('ratio').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<AspectRatio as="figure" data-testid="ratio" />);
    expect(screen.getByTestId('ratio').tagName).toBe('FIGURE');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<AspectRatio ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<AspectRatio data-testid="ratio" className="custom" />);
    expect(screen.getByTestId('ratio').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<AspectRatio>content</AspectRatio>);
    await expectNoA11yViolations(container);
  });

  it('defaults to a 1:1 ratio', () => {
    render(<AspectRatio data-testid="ratio" />);
    expect(screen.getByTestId('ratio')).toHaveStyle({ aspectRatio: '1' });
  });

  it('applies a custom ratio', () => {
    render(<AspectRatio data-testid="ratio" ratio={16 / 9} />);
    expect(screen.getByTestId('ratio')).toHaveStyle({ aspectRatio: String(16 / 9) });
  });
});
