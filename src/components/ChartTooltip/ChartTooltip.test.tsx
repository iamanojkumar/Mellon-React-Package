import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { ChartTooltip } from './ChartTooltip';

describe('ChartTooltip', () => {
  it('renders its content', () => {
    render(
      <ChartTooltip x={50} y={50}>
        Jan — 32
      </ChartTooltip>,
    );
    expect(screen.getByText('Jan — 32')).toBeInTheDocument();
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ChartTooltip ref={ref} x={50} y={50}>
        Jan
      </ChartTooltip>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // The plot is aria-hidden and the table twin already carries every value —
  // announcing the readout too would read the same numbers a second time.
  it('is hidden from assistive tech', () => {
    render(
      <ChartTooltip x={50} y={50}>
        Jan
      </ChartTooltip>,
    );
    expect(screen.getByText('Jan')).toHaveAttribute('aria-hidden', 'true');
  });

  // Percentages, not pixels: the plot scales with its container, so a pixel
  // offset would drift on resize while a percentage of the same box doesn't.
  it('positions itself as a percentage of the plot box', () => {
    render(
      <ChartTooltip x={25} y={75}>
        Jan
      </ChartTooltip>,
    );
    const tooltip = screen.getByText('Jan');
    expect(tooltip.style.left).toBe('25%');
    expect(tooltip.style.top).toBe('75%');
  });

  it('clamps an out-of-range anchor into the box', () => {
    render(
      <ChartTooltip x={-40} y={180}>
        Jan
      </ChartTooltip>,
    );
    const tooltip = screen.getByText('Jan');
    expect(tooltip.style.left).toBe('0%');
    expect(tooltip.style.top).toBe('100%');
  });

  it('merges a caller style without losing its position', () => {
    render(
      <ChartTooltip x={40} y={40} style={{ opacity: 0.5 }}>
        Jan
      </ChartTooltip>,
    );
    const tooltip = screen.getByText('Jan');
    expect(tooltip.style.left).toBe('40%');
    expect(tooltip.style.opacity).toBe('0.5');
  });

  describe('edge alignment', () => {
    // Centred on the anchor, half the box would hang outside the figure and
    // clip at either end of the axis.
    it('centres away from the edges', () => {
      render(
        <ChartTooltip x={50} y={50}>
          Mid
        </ChartTooltip>,
      );
      expect(screen.getByText('Mid')).toHaveAttribute('data-align', 'center');
    });

    it('anchors from the left near the left edge', () => {
      render(
        <ChartTooltip x={5} y={50}>
          Start
        </ChartTooltip>,
      );
      expect(screen.getByText('Start')).toHaveAttribute('data-align', 'start');
    });

    it('anchors from the right near the right edge', () => {
      render(
        <ChartTooltip x={95} y={50}>
          End
        </ChartTooltip>,
      );
      expect(screen.getByText('End')).toHaveAttribute('data-align', 'end');
    });
  });
});
