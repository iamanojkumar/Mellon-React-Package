import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import userEvent from '@testing-library/user-event';
import { BarChart } from './BarChart';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const data = [
  { label: 'Jan', value: 10 },
  { label: 'Feb', value: 20 },
];

/** Matches the component's own defaults, so the expected geometry is derivable. */
const INNER_HEIGHT = 240 - 8 - 24;

function bars(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg rect:not([data-hit-area])'));
}

function numeric(element: Element, attribute: string) {
  return Number(element.getAttribute(attribute));
}

describe('BarChart', () => {
  it('renders a figure captioned with the label', () => {
    render(<BarChart label="Monthly revenue" data={data} />);
    const figure = screen.getByRole('figure');
    expect(within(figure).getByText('Monthly revenue')).toBeInTheDocument();
  });

  it('forwards a ref to the figure', () => {
    const ref = createRef<HTMLElement>();
    render(<BarChart ref={ref} label="Revenue" data={data} />);
    expect(ref.current?.tagName).toBe('FIGURE');
  });

  it('hides the plot from assistive tech, leaving the table as the accessible content', () => {
    const { container } = render(<BarChart label="Revenue" data={data} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('table', { name: 'Revenue' })).toBeInTheDocument();
  });

  it('renders one bar per datum', () => {
    const { container } = render(<BarChart label="Revenue" data={data} />);
    expect(bars(container)).toHaveLength(2);
  });

  describe('geometry', () => {
    it('scales bar height by value and sits every bar on the baseline', () => {
      const { container } = render(<BarChart label="Revenue" data={data} />);
      const [first, second] = bars(container);

      // Domain nice-rounds to [0, 20], so 10 is exactly half the plot.
      expect(numeric(first!, 'height')).toBeCloseTo(INNER_HEIGHT / 2, 5);
      expect(numeric(second!, 'height')).toBeCloseTo(INNER_HEIGHT, 5);

      // Bottom edge of both bars is the zero baseline.
      expect(numeric(first!, 'y') + numeric(first!, 'height')).toBeCloseTo(INNER_HEIGHT, 5);
      expect(numeric(second!, 'y') + numeric(second!, 'height')).toBeCloseTo(INNER_HEIGHT, 5);
    });

    it('lays bars out left to right without overlapping', () => {
      const { container } = render(<BarChart label="Revenue" data={data} />);
      const [first, second] = bars(container);
      expect(numeric(first!, 'x') + numeric(first!, 'width')).toBeLessThanOrEqual(
        numeric(second!, 'x'),
      );
    });

    it('honours bandPadding', () => {
      const { container: tight } = render(
        <BarChart label="Revenue" data={data} bandPadding={0.05} />,
      );
      const { container: loose } = render(
        <BarChart label="Revenue" data={data} bandPadding={0.6} />,
      );
      expect(numeric(bars(tight)[0]!, 'width')).toBeGreaterThan(numeric(bars(loose)[0]!, 'width'));
    });

    // includeZero defaults true because a clipped baseline exaggerates
    // differences — the most common way a bar chart misleads.
    it('includes zero in the domain by default and can be told not to', () => {
      const near = [
        { label: 'A', value: 99 },
        { label: 'B', value: 100 },
      ];
      const { container: zeroed } = render(<BarChart label="Uptime" data={near} />);
      const { container: clipped } = render(
        <BarChart label="Uptime" data={near} includeZero={false} />,
      );

      const zeroedRatio = numeric(bars(zeroed)[0]!, 'height') / numeric(bars(zeroed)[1]!, 'height');
      const clippedRatio =
        numeric(bars(clipped)[0]!, 'height') / numeric(bars(clipped)[1]!, 'height');

      expect(zeroedRatio).toBeGreaterThan(0.9);
      expect(clippedRatio).toBeLessThan(zeroedRatio);
    });
  });

  describe('negative values', () => {
    const mixed = [
      { label: 'Up', value: 10 },
      { label: 'Down', value: -10 },
    ];

    it('grows bars in both directions from a shared baseline', () => {
      const { container } = render(<BarChart label="Change" data={mixed} />);
      const [up, down] = bars(container);
      // The positive bar ends where the negative one begins: the zero line.
      expect(numeric(up!, 'y') + numeric(up!, 'height')).toBeCloseTo(numeric(down!, 'y'), 5);
    });

    it('draws an explicit zero line only when the baseline leaves the axis', () => {
      const { container: mixedContainer } = render(
        <BarChart label="Change" data={mixed} showGrid={false} />,
      );
      const { container: positiveContainer } = render(
        <BarChart label="Revenue" data={data} showGrid={false} />,
      );

      // Both charts draw two axis lines; only the mixed one adds a zero rule.
      expect(mixedContainer.querySelectorAll('svg line')).toHaveLength(3);
      expect(positiveContainer.querySelectorAll('svg line')).toHaveLength(2);
    });
  });

  describe('axes', () => {
    it('labels every category', () => {
      const { container } = render(<BarChart label="Revenue" data={data} />);
      const text = Array.from(container.querySelectorAll('svg text')).map((el) => el.textContent);
      expect(text).toContain('Jan');
      expect(text).toContain('Feb');
    });

    it('applies formatValue to the value axis as well as the table', () => {
      const { container } = render(
        <BarChart label="Revenue" data={data} formatValue={(value) => `$${value}`} />,
      );
      const text = Array.from(container.querySelectorAll('svg text')).map((el) => el.textContent);
      expect(text).toContain('$0');
      expect(text).toContain('$20');
      expect(screen.getByRole('cell', { name: '$10' })).toBeInTheDocument();
    });

    it('omits the grid when showGrid is false', () => {
      const { container: withGrid } = render(<BarChart label="Revenue" data={data} />);
      const { container: without } = render(
        <BarChart label="Revenue" data={data} showGrid={false} />,
      );
      expect(withGrid.querySelectorAll('svg line').length).toBeGreaterThan(
        without.querySelectorAll('svg line').length,
      );
    });
  });

  // Dropping the mark keeps the plot honest; keeping the row keeps the bad
  // datum visible rather than silently disappearing.
  it('skips non-finite values in the plot but keeps them in the table', () => {
    const { container } = render(
      <BarChart
        label="Revenue"
        data={[
          { label: 'Jan', value: 10 },
          { label: 'Feb', value: Number.NaN },
        ]}
      />,
    );
    expect(bars(container)).toHaveLength(1);
    expect(screen.getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
  });

  it('renders an empty series without crashing', () => {
    const { container } = render(<BarChart label="Revenue" data={[]} />);
    expect(bars(container)).toHaveLength(0);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BarChart label="Monthly revenue" data={data} />);
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with the table toggle', async () => {
    const { container } = render(<BarChart label="Monthly revenue" data={data} tableToggle />);
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

describe('BarChart tooltip', () => {
  it('reads out the hovered bar and clears on leave', () => {
    const { container } = render(<BarChart label="Revenue" data={data} />);
    expect(screen.queryByText('Feb — 20')).not.toBeInTheDocument();

    pointerMove(hitAreas(container)[1]!);
    expect(screen.getByText('Feb — 20')).toBeInTheDocument();

    pointerLeave(container.querySelector('svg')!);
    expect(screen.queryByText('Feb — 20')).not.toBeInTheDocument();
  });

  it('formats the value in the readout', () => {
    const { container } = render(
      <BarChart label="Revenue" data={data} formatValue={(value) => `$${value}`} />,
    );
    pointerMove(hitAreas(container)[0]!);
    expect(screen.getByText('Jan — $10')).toBeInTheDocument();
  });

  it('accepts a custom readout body', () => {
    const { container } = render(
      <BarChart label="Revenue" data={data} renderTooltip={(datum) => `${datum.label}!`} />,
    );
    pointerMove(hitAreas(container)[0]!);
    expect(screen.getByText('Jan!')).toBeInTheDocument();
  });

  // The hit area covers the whole slot including the gutter, so a pointer
  // between two bars still picks a side instead of dismissing the readout.
  it('gives every category a full-slot hit area', () => {
    const { container } = render(<BarChart label="Revenue" data={data} />);
    const [first, second] = hitAreas(container);
    expect(Number(first!.getAttribute('width'))).toBeCloseTo(
      Number(second!.getAttribute('width')),
      5,
    );
    expect(Number(first!.getAttribute('x')) + Number(first!.getAttribute('width'))).toBeCloseTo(
      Number(second!.getAttribute('x')),
      5,
    );
  });

  it('outlines the hovered bar', () => {
    const { container } = render(<BarChart label="Revenue" data={data} showGrid={false} />);
    expect(container.querySelector('svg rect[data-active]')).toBeNull();

    pointerMove(hitAreas(container)[0]!);
    expect(container.querySelector('svg rect[data-active]')).not.toBeNull();
    // A bar already spans baseline-to-value, so no crosshair is added — the
    // two axis lines are all that should be there.
    expect(container.querySelectorAll('svg line')).toHaveLength(2);
  });

  it('renders no hit areas or readout when showTooltip is false', () => {
    const { container } = render(<BarChart label="Revenue" data={data} showTooltip={false} />);
    // Only the two bars remain.
    expect(container.querySelectorAll('svg rect')).toHaveLength(2);
  });

  it('does not read out a non-finite value', () => {
    const { container } = render(
      <BarChart
        label="Revenue"
        data={[
          { label: 'Jan', value: 10 },
          { label: 'Feb', value: Number.NaN },
        ]}
      />,
    );
    pointerMove(hitAreas(container)[1]!);
    expect(screen.queryByText(/Feb —/)).not.toBeInTheDocument();
  });
});

describe('BarChart data labels', () => {
  it('are off by default and print each value when enabled', () => {
    const { container: off } = render(<BarChart label="Revenue" data={data} />);
    expect(off.querySelector('svg text[data-placement]')).toBeNull();

    const { container: on } = render(<BarChart label="Revenue" data={data} showDataLabels />);
    const printed = Array.from(on.querySelectorAll('svg text[data-placement]')).map(
      (el) => el.textContent,
    );
    expect(printed).toEqual(['10', '20']);
  });

  it('flips below the baseline for negative values', () => {
    const { container } = render(
      <BarChart
        label="Change"
        data={[
          { label: 'Up', value: 10 },
          { label: 'Down', value: -10 },
        ]}
        showDataLabels
      />,
    );
    const placements = Array.from(container.querySelectorAll('svg text[data-placement]')).map(
      (el) => el.getAttribute('data-placement'),
    );
    expect(placements).toEqual(['above', 'below']);
  });
});

// The feature lives in ChartContainer, so every chart mounting in it gets the
// affordance without wiring its own — this guards that pass-through.
describe('BarChart aiExplain', () => {
  it('is inert without a provider and explains the series with one', async () => {
    const user = userEvent.setup();
    render(<BarChart label="Revenue" data={data} aiExplain />);
    expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();

    const client: AIClient = {
      complete: vi.fn().mockResolvedValue('Revenue doubled in February.'),
    };
    render(
      <AIProvider client={client}>
        <BarChart label="Monthly revenue" data={data} aiExplain />
      </AIProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
    expect(vi.mocked(client.complete).mock.calls[0]![0]!.prompt).toContain('Feb: 20');
    await screen.findByText('Revenue doubled in February.');
  });
});
