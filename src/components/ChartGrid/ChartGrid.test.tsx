import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { ChartGrid } from './ChartGrid';

function renderGrid(ui: React.ReactElement) {
  return render(
    <svg aria-hidden="true" viewBox="0 0 200 200">
      {ui}
    </svg>,
  );
}

describe('ChartGrid', () => {
  it('renders a line per position', () => {
    const { container } = renderGrid(<ChartGrid positions={[0, 50, 100]} length={200} />);
    expect(container.querySelectorAll('line')).toHaveLength(3);
  });

  it('forwards a ref to the group', () => {
    const ref = createRef<SVGGElement>();
    renderGrid(<ChartGrid ref={ref} positions={[0]} length={200} />);
    expect(ref.current?.tagName).toBe('g');
  });

  it('runs lines across the plot at each y offset when horizontal', () => {
    const { container } = renderGrid(<ChartGrid positions={[50]} length={200} />);
    const line = container.querySelector('line')!;
    expect(line).toHaveAttribute('y1', '50');
    expect(line).toHaveAttribute('y2', '50');
    expect(line).toHaveAttribute('x1', '0');
    expect(line).toHaveAttribute('x2', '200');
  });

  it('runs lines down the plot at each x offset when vertical', () => {
    const { container } = renderGrid(
      <ChartGrid positions={[50]} length={200} orientation="vertical" />,
    );
    const line = container.querySelector('line')!;
    expect(line).toHaveAttribute('x1', '50');
    expect(line).toHaveAttribute('x2', '50');
    expect(line).toHaveAttribute('y1', '0');
    expect(line).toHaveAttribute('y2', '200');
  });

  it('renders no positions without crashing', () => {
    const { container } = renderGrid(<ChartGrid positions={[]} length={200} />);
    expect(container.querySelectorAll('line')).toHaveLength(0);
  });
});
