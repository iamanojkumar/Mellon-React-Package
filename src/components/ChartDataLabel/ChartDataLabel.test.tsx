import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render } from '@testing-library/react';
import { ChartDataLabel } from './ChartDataLabel';

function renderLabel(ui: React.ReactElement) {
  return render(
    <svg aria-hidden="true" viewBox="0 0 200 200">
      {ui}
    </svg>,
  );
}

describe('ChartDataLabel', () => {
  it('renders its value at the anchor point', () => {
    const { container } = renderLabel(
      <ChartDataLabel x={40} y={80}>
        32
      </ChartDataLabel>,
    );
    const label = container.querySelector('text')!;
    expect(label).toHaveTextContent('32');
    expect(label).toHaveAttribute('x', '40');
    expect(label).toHaveAttribute('y', '80');
  });

  it('forwards a ref', () => {
    const ref = createRef<SVGTextElement>();
    renderLabel(
      <ChartDataLabel ref={ref} x={0} y={0}>
        1
      </ChartDataLabel>,
    );
    expect(ref.current?.tagName).toBe('text');
  });

  it('sits above the anchor by default', () => {
    const { container } = renderLabel(
      <ChartDataLabel x={0} y={0}>
        1
      </ChartDataLabel>,
    );
    expect(container.querySelector('text')).toHaveAttribute('data-placement', 'above');
  });

  // Marks hanging below the baseline need their label on the other side, or
  // it lands on top of the bar it describes.
  it('sits below the anchor when asked', () => {
    const { container } = renderLabel(
      <ChartDataLabel x={0} y={0} placement="below">
        -1
      </ChartDataLabel>,
    );
    expect(container.querySelector('text')).toHaveAttribute('data-placement', 'below');
  });
});
