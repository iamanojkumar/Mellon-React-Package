import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Progress } from './Progress';

describe('Progress', () => {
  it('renders as a div with role="progressbar"', () => {
    render(<Progress value={50} data-testid="progress" />);
    expect(screen.getByTestId('progress').tagName).toBe('DIV');
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Progress ref={ref} value={50} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Progress data-testid="progress" className="custom" value={50} />);
    expect(screen.getByTestId('progress').className).toContain('custom');
  });

  it('has no accessibility violations when determinate', async () => {
    const { container } = render(<Progress value={50} label="Upload progress" />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when indeterminate', async () => {
    const { container } = render(<Progress label="Loading" />);
    await expectNoA11yViolations(container);
  });

  it('sets aria-valuenow/min/max for a determinate value', () => {
    render(<Progress value={30} max={200} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '200');
  });

  it('clamps the value within [0, max]', () => {
    render(<Progress value={500} max={100} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('omits aria-valuenow and sets data-indeterminate when value is not given', () => {
    render(<Progress data-testid="progress" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByTestId('progress')).toHaveAttribute('data-indeterminate', 'true');
  });

  it('defaults to size=md', () => {
    render(<Progress data-testid="progress" value={50} />);
    expect(screen.getByTestId('progress')).toHaveAttribute('data-size', 'md');
  });
});
