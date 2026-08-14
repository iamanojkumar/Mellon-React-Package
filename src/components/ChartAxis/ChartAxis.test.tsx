import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { ChartAxis } from './ChartAxis';

const ticks = [
  { position: 0, label: '0' },
  { position: 50, label: '50' },
  { position: 100, label: '100' },
];

function renderAxis(ui: React.ReactElement) {
  return render(
    <svg aria-hidden="true" viewBox="0 0 200 200">
      {ui}
    </svg>,
  );
}

describe('ChartAxis', () => {
  it('renders a label per tick', () => {
    const { container } = renderAxis(<ChartAxis orientation="bottom" ticks={ticks} length={100} />);
    const text = Array.from(container.querySelectorAll('text')).map((el) => el.textContent);
    expect(text).toEqual(['0', '50', '100']);
  });

  it('forwards a ref to the group', () => {
    const ref = createRef<SVGGElement>();
    renderAxis(<ChartAxis ref={ref} orientation="left" ticks={ticks} length={100} />);
    expect(ref.current?.tagName).toBe('g');
  });

  it('exposes the orientation for the stylesheet to anchor labels from', () => {
    const { container } = renderAxis(<ChartAxis orientation="left" ticks={ticks} length={100} />);
    expect(container.querySelector('g')).toHaveAttribute('data-orientation', 'left');
  });

  // The two orientations differ only in which coordinate the tick position
  // drives — that swap is the whole component.
  it('drives y from the tick position when vertical', () => {
    const { container } = renderAxis(<ChartAxis orientation="left" ticks={ticks} length={100} />);
    const label = container.querySelectorAll('text')[1]!;
    expect(label).toHaveAttribute('y', '50');
    expect(label).toHaveAttribute('x', '0');
  });

  it('drives x from the tick position when horizontal', () => {
    const { container } = renderAxis(<ChartAxis orientation="bottom" ticks={ticks} length={100} />);
    const label = container.querySelectorAll('text')[1]!;
    expect(label).toHaveAttribute('x', '50');
    expect(label).toHaveAttribute('y', '0');
  });

  it('runs the axis line along the axis', () => {
    const { container: vertical } = renderAxis(
      <ChartAxis orientation="left" ticks={ticks} length={100} />,
    );
    const { container: horizontal } = renderAxis(
      <ChartAxis orientation="bottom" ticks={ticks} length={100} />,
    );

    expect(vertical.querySelector('line')).toHaveAttribute('y2', '100');
    expect(vertical.querySelector('line')).toHaveAttribute('x2', '0');
    expect(horizontal.querySelector('line')).toHaveAttribute('x2', '100');
    expect(horizontal.querySelector('line')).toHaveAttribute('y2', '0');
  });

  it('drops the line but keeps the labels when hideLine is set', () => {
    const { container } = renderAxis(
      <ChartAxis orientation="bottom" ticks={ticks} length={100} hideLine />,
    );
    expect(container.querySelector('line')).toBeNull();
    expect(container.querySelectorAll('text')).toHaveLength(3);
  });

  it('forwards a transform so the caller can place the axis', () => {
    const { container } = renderAxis(
      <ChartAxis orientation="left" ticks={ticks} length={100} transform="translate(44, 8)" />,
    );
    expect(container.querySelector('g')).toHaveAttribute('transform', 'translate(44, 8)');
  });

  it('renders no ticks without crashing', () => {
    const { container } = renderAxis(<ChartAxis orientation="left" ticks={[]} length={100} />);
    expect(container.querySelectorAll('text')).toHaveLength(0);
  });
});
