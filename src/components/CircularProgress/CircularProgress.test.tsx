import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CircularProgress } from './CircularProgress';

describe('CircularProgress', () => {
  it('renders as a div with role="progressbar"', () => {
    render(<CircularProgress value={50} data-testid="progress" />);
    expect(screen.getByTestId('progress').tagName).toBe('DIV');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<CircularProgress ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<CircularProgress data-testid="progress" className="custom" value={50} />);
    expect(screen.getByTestId('progress').className).toContain('custom');
  });

  it('has no accessibility violations when determinate', async () => {
    const { container } = render(<CircularProgress value={50} label="Upload progress" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when indeterminate', async () => {
    const { container } = render(<CircularProgress label="Loading" />);
    await expectNoA11yViolations(container);
  });

  it('sets aria-valuenow/min/max for a determinate value, clamped to [0, max]', () => {
    render(<CircularProgress value={150} max={100} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('omits aria-valuenow and sets data-indeterminate when value is not given', () => {
    render(<CircularProgress data-testid="progress" />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByTestId('progress')).toHaveAttribute('data-indeterminate', 'true');
  });

  it('renders an svg sized for the size prop', () => {
    render(<CircularProgress value={50} size="lg" data-testid="progress" />);
    const svg = screen.getByTestId('progress').querySelector('svg');
    expect(svg).toHaveAttribute('width', '56');
    expect(svg).toHaveAttribute('height', '56');
  });
});
