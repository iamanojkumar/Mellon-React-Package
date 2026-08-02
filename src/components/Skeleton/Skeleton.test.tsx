import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders as a div', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Skeleton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Skeleton data-testid="skeleton" className="custom" />);
    expect(screen.getByTestId('skeleton').className).toContain('custom');
  });

  it('is hidden from assistive tech', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Skeleton />);
    await expectNoA11yViolations(container);
  });

  it('defaults to variant=text', () => {
    render(<Skeleton data-testid="skeleton" />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('data-variant', 'text');
  });

  it('applies width/height as pixel values when given numbers', () => {
    render(<Skeleton data-testid="skeleton" width={120} height={40} />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveStyle({ width: '120px', height: '40px' });
  });

  it('passes through string width/height values unchanged', () => {
    render(<Skeleton data-testid="skeleton" width="50%" />);
    expect(screen.getByTestId('skeleton')).toHaveStyle({ width: '50%' });
  });
});
