import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ChartSurface } from './ChartSurface';
import type { ChartDataPoint } from './ChartSurface';

const DATA: ChartDataPoint[] = [
  { label: 'Jan', value: 10 },
  { label: 'Feb', value: 25 },
  { label: 'Mar', value: 15 },
];

describe('ChartSurface', () => {
  it('renders a bar rect per data point by default', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    expect(container.querySelectorAll('rect')).toHaveLength(3);
  });

  it('renders a polyline and a circle per point for type="line"', () => {
    const { container } = render(<ChartSurface type="line" data={DATA} label="Monthly revenue" />);
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
  });

  it('renders visible axis labels for each data point', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    const axis = container.querySelector('[class*="axis"]')!;
    expect(axis).toHaveTextContent('Jan');
    expect(axis).toHaveTextContent('Feb');
    expect(axis).toHaveTextContent('Mar');
  });

  it('marks the SVG and axis labels as decorative (aria-hidden)', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const axisLabel = screen.getAllByText('Jan')[0]!;
    expect(axisLabel.closest('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders the real accessible content as a visually-hidden data table', () => {
    render(<ChartSurface data={DATA} label="Monthly revenue" />);
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent('Monthly revenue');
    expect(screen.getByRole('cell', { name: 'Jan' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '25' })).toBeInTheDocument();
  });

  it('handles an all-zero series without producing NaN geometry', () => {
    const { container } = render(
      <ChartSurface data={[{ label: 'A', value: 0 }]} label="Empty series" />,
    );
    const rect = container.querySelector('rect')!;
    expect(rect.getAttribute('height')).toBe('0');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ChartSurface ref={ref} data={DATA} label="Monthly revenue" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <ChartSurface data={DATA} label="Monthly revenue" className="custom" data-testid="chart" />,
    );
    expect(screen.getByTestId('chart').className).toContain('custom');
  });

  it('has no accessibility violations, as a bar or line chart', async () => {
    const bar = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    await expectNoA11yViolations(bar.container);
    bar.unmount();
    const line = render(<ChartSurface type="line" data={DATA} label="Monthly revenue" />);
    await expectNoA11yViolations(line.container);
  });
});
