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

function marks(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg rect:not([data-hit-area])'));
}

describe('ChartSurface', () => {
  it('renders a bar per data point by default', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    expect(marks(container)).toHaveLength(3);
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('renders a polyline and a marker per point for type="line"', () => {
    const { container } = render(<ChartSurface type="line" data={DATA} label="Monthly revenue" />);
    expect(container.querySelectorAll('polyline')).toHaveLength(1);
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(marks(container)).toHaveLength(0);
  });

  it('labels every category on the axis', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    const text = Array.from(container.querySelectorAll('svg text')).map((el) => el.textContent);
    expect(text).toContain('Jan');
    expect(text).toContain('Feb');
    expect(text).toContain('Mar');
  });

  it('marks the plot as decorative, leaving the table as the accessible content', () => {
    render(<ChartSurface data={DATA} label="Monthly revenue" />);
    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    const table = screen.getByRole('table', { name: 'Monthly revenue' });
    expect(table).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '25' })).toBeInTheDocument();
  });

  it('handles an all-zero series without producing NaN geometry', () => {
    const { container } = render(
      <ChartSurface data={[{ label: 'A', value: 0 }]} label="Empty series" />,
    );
    expect(marks(container)[0]?.getAttribute('height')).toBe('0');
  });

  // Now a <figure>, because the plot and its caption are one unit — the
  // charts it delegates to own that markup.
  it('forwards the ref to the figure', () => {
    const ref = createRef<HTMLElement>();
    render(<ChartSurface ref={ref} data={DATA} label="Monthly revenue" />);
    expect(ref.current?.tagName).toBe('FIGURE');
  });

  it('merges a custom className and forwards unknown props', () => {
    render(
      <ChartSurface data={DATA} label="Monthly revenue" className="custom" data-testid="chart" />,
    );
    expect(screen.getByTestId('chart').className).toContain('custom');
  });

  // The whole point of the preset: behaviour comes from the charts, so it
  // can't drift away from them.
  it('inherits the underlying chart options', () => {
    const { container } = render(
      <ChartSurface data={DATA} label="Monthly revenue" showGrid={false} showTooltip={false} />,
    );
    // Two axis lines only — no grid, and no hit areas.
    expect(container.querySelectorAll('svg line')).toHaveLength(2);
    expect(container.querySelectorAll('svg rect[data-hit-area]')).toHaveLength(0);
  });

  it('sizes the plot with height, overridably', () => {
    const { container } = render(<ChartSurface data={DATA} label="Monthly revenue" height={320} />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 480 320');
  });

  it('has no accessibility violations, as a bar or line chart', async () => {
    const bar = render(<ChartSurface data={DATA} label="Monthly revenue" />);
    await expectNoA11yViolations(bar.container);
    bar.unmount();
    const line = render(<ChartSurface type="line" data={DATA} label="Monthly revenue" />);
    await expectNoA11yViolations(line.container);
  });
});
