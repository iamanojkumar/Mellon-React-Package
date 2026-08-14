import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { LineChart } from './LineChart';

const data = [
  { label: 'W1', value: 10 },
  { label: 'W2', value: 20 },
  { label: 'W3', value: 15 },
];

function polylines(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg polyline'));
}

function markers(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg circle'));
}

function pointsOf(polyline: Element) {
  return (polyline.getAttribute('points') ?? '')
    .split(' ')
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x: x as number, y: y as number };
    });
}

describe('LineChart', () => {
  it('renders a figure captioned with the label', () => {
    render(<LineChart label="Weekly sign-ups" data={data} />);
    const figure = screen.getByRole('figure');
    expect(within(figure).getByText('Weekly sign-ups')).toBeInTheDocument();
  });

  it('forwards a ref to the figure', () => {
    const ref = createRef<HTMLElement>();
    render(<LineChart ref={ref} label="Sign-ups" data={data} />);
    expect(ref.current?.tagName).toBe('FIGURE');
  });

  it('hides the plot from assistive tech, leaving the table as the accessible content', () => {
    const { container } = render(<LineChart label="Sign-ups" data={data} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('table', { name: 'Sign-ups' })).toBeInTheDocument();
  });

  describe('geometry', () => {
    it('draws one polyline through every point', () => {
      const { container } = render(<LineChart label="Sign-ups" data={data} />);
      expect(polylines(container)).toHaveLength(1);
      expect(pointsOf(polylines(container)[0]!)).toHaveLength(3);
    });

    it('puts higher values higher on screen', () => {
      const { container } = render(<LineChart label="Sign-ups" data={data} />);
      const [low, high, mid] = pointsOf(polylines(container)[0]!);
      // SVG y grows downward, so the largest value has the smallest y.
      expect(high!.y).toBeLessThan(mid!.y);
      expect(mid!.y).toBeLessThan(low!.y);
    });

    it('advances points left to right', () => {
      const { container } = render(<LineChart label="Sign-ups" data={data} />);
      const points = pointsOf(polylines(container)[0]!);
      expect(points[0]!.x).toBeLessThan(points[1]!.x);
      expect(points[1]!.x).toBeLessThan(points[2]!.x);
    });

    it('renders a marker per point, and none when showMarkers is false', () => {
      const { container: withMarkers } = render(<LineChart label="Sign-ups" data={data} />);
      const { container: without } = render(
        <LineChart label="Sign-ups" data={data} showMarkers={false} />,
      );
      expect(markers(withMarkers)).toHaveLength(3);
      expect(markers(without)).toHaveLength(0);
    });
  });

  // Bridging a missing reading would draw a measurement nobody took.
  describe('gaps', () => {
    const gapped = [
      { label: 'W1', value: 10 },
      { label: 'W2', value: 20 },
      { label: 'W3', value: Number.NaN },
      { label: 'W4', value: 15 },
      { label: 'W5', value: 25 },
    ];

    it('splits the line into a segment per run of finite values', () => {
      const { container } = render(<LineChart label="Sign-ups" data={gapped} />);
      const segments = polylines(container);
      expect(segments).toHaveLength(2);
      expect(pointsOf(segments[0]!)).toHaveLength(2);
      expect(pointsOf(segments[1]!)).toHaveLength(2);
    });

    it('keeps the missing value in the table', () => {
      render(<LineChart label="Sign-ups" data={gapped} />);
      expect(screen.getByRole('rowheader', { name: 'W3' })).toBeInTheDocument();
    });

    it('marks the finite points only', () => {
      const { container } = render(<LineChart label="Sign-ups" data={gapped} />);
      expect(markers(container)).toHaveLength(4);
    });
  });

  it('draws a marker but no line for a single point', () => {
    const { container } = render(
      <LineChart label="Sign-ups" data={[{ label: 'W1', value: 10 }]} />,
    );
    expect(polylines(container)).toHaveLength(0);
    expect(markers(container)).toHaveLength(1);
  });

  describe('axes', () => {
    it('labels every category', () => {
      const { container } = render(<LineChart label="Sign-ups" data={data} />);
      const text = Array.from(container.querySelectorAll('svg text')).map((el) => el.textContent);
      expect(text).toContain('W1');
      expect(text).toContain('W3');
    });

    it('applies formatValue to the value axis as well as the table', () => {
      const { container } = render(
        <LineChart label="Sign-ups" data={data} formatValue={(value) => `${value}k`} />,
      );
      const text = Array.from(container.querySelectorAll('svg text')).map((el) => el.textContent);
      expect(text).toContain('0k');
      expect(screen.getByRole('cell', { name: '10k' })).toBeInTheDocument();
    });

    it('omits the grid when showGrid is false', () => {
      const { container: withGrid } = render(<LineChart label="Sign-ups" data={data} />);
      const { container: without } = render(
        <LineChart label="Sign-ups" data={data} showGrid={false} />,
      );
      expect(withGrid.querySelectorAll('svg line').length).toBeGreaterThan(
        without.querySelectorAll('svg line').length,
      );
    });
  });

  it('renders an empty series without crashing', () => {
    const { container } = render(<LineChart label="Sign-ups" data={[]} />);
    expect(polylines(container)).toHaveLength(0);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<LineChart label="Weekly sign-ups" data={data} />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with the table toggle', async () => {
    const { container } = render(<LineChart label="Weekly sign-ups" data={data} tableToggle />);
    await expectNoA11yViolations(container);
  });
});

// jsdom has no PointerEvent constructor, so dispatch a MouseEvent of the right
// type through fireEvent — that keeps the update act()-wrapped.
function pointerMove(element: Element) {
  fireEvent(element, new MouseEvent('pointermove', { bubbles: true }));
}

// React synthesizes pointerleave from a delegated pointerout, so dispatching
// the leave event directly does nothing — the pointer has to be seen moving
// to a target outside the element.
function pointerLeave(element: Element) {
  fireEvent(element, new MouseEvent('pointerout', { bubbles: true, relatedTarget: document.body }));
}

function hitAreas(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg rect[data-hit-area]'));
}

describe('LineChart tooltip', () => {
  it('reads out the hovered point and clears on leave', () => {
    const { container } = render(<LineChart label="Sign-ups" data={data} />);
    expect(screen.queryByText('W2 — 20')).not.toBeInTheDocument();

    pointerMove(hitAreas(container)[1]!);
    expect(screen.getByText('W2 — 20')).toBeInTheDocument();

    pointerLeave(container.querySelector('svg')!);
    expect(screen.queryByText('W2 — 20')).not.toBeInTheDocument();
  });

  it('accepts a custom readout body', () => {
    const { container } = render(
      <LineChart label="Sign-ups" data={data} renderTooltip={(datum) => `${datum.value} users`} />,
    );
    pointerMove(hitAreas(container)[0]!);
    expect(screen.getByText('10 users')).toBeInTheDocument();
  });

  it('draws a crosshair at the hovered point', () => {
    const { container } = render(<LineChart label="Sign-ups" data={data} showGrid={false} />);
    const before = container.querySelectorAll('svg line').length;
    pointerMove(hitAreas(container)[0]!);
    expect(container.querySelectorAll('svg line')).toHaveLength(before + 1);
  });

  it('gives every category a hit area, gaps included', () => {
    const { container } = render(
      <LineChart
        label="Sign-ups"
        data={[
          { label: 'W1', value: 10 },
          { label: 'W2', value: Number.NaN },
        ]}
      />,
    );
    expect(hitAreas(container)).toHaveLength(2);
  });

  it('does not read out a non-finite value', () => {
    const { container } = render(
      <LineChart
        label="Sign-ups"
        data={[
          { label: 'W1', value: 10 },
          { label: 'W2', value: Number.NaN },
        ]}
      />,
    );
    pointerMove(hitAreas(container)[1]!);
    expect(screen.queryByText(/W2 —/)).not.toBeInTheDocument();
  });

  it('renders no hit areas when showTooltip is false', () => {
    const { container } = render(<LineChart label="Sign-ups" data={data} showTooltip={false} />);
    expect(hitAreas(container)).toHaveLength(0);
  });
});

describe('LineChart data labels', () => {
  it('are off by default and print each value when enabled', () => {
    const { container: off } = render(<LineChart label="Sign-ups" data={data} />);
    expect(off.querySelector('svg text[data-placement]')).toBeNull();

    const { container: on } = render(<LineChart label="Sign-ups" data={data} showDataLabels />);
    const printed = Array.from(on.querySelectorAll('svg text[data-placement]')).map(
      (el) => el.textContent,
    );
    expect(printed).toEqual(['10', '20', '15']);
  });

  it('skips labels for missing values', () => {
    const { container } = render(
      <LineChart
        label="Sign-ups"
        data={[
          { label: 'W1', value: 10 },
          { label: 'W2', value: Number.NaN },
        ]}
        showDataLabels
      />,
    );
    expect(container.querySelectorAll('svg text[data-placement]')).toHaveLength(1);
  });
});
