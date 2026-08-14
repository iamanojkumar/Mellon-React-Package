import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from './LineChart';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const signups = [
  { label: 'W1', value: 120 },
  { label: 'W2', value: 168 },
  { label: 'W3', value: 141 },
  { label: 'W4', value: 210 },
  { label: 'W5', value: 264 },
  { label: 'W6', value: 233 },
];

const meta = {
  title: 'Charts/LineChart',
  component: LineChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof LineChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
  },
};

export const WithDescriptionAndFormatting: Story = {
  args: {
    label: 'Weekly sign-ups',
    description: 'New accounts created, by ISO week.',
    data: signups,
    categoryHeading: 'Week',
    valueHeading: 'Sign-ups',
    formatValue: (value: number) => value.toLocaleString('en-US'),
  },
};

export const WithTableToggle: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    tableToggle: true,
  },
};

/** A missing reading breaks the line instead of being interpolated across. */
export const WithGaps: Story = {
  args: {
    label: 'Weekly sign-ups',
    description: 'Weeks 3 and 4 were not recorded.',
    data: [
      { label: 'W1', value: 120 },
      { label: 'W2', value: 168 },
      { label: 'W3', value: Number.NaN },
      { label: 'W4', value: Number.NaN },
      { label: 'W5', value: 264 },
      { label: 'W6', value: 233 },
    ],
    tableToggle: true,
  },
};

export const WithoutMarkers: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    showMarkers: false,
  },
};

export const WithoutGrid: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    showGrid: false,
  },
};

/**
 * A line encodes change by slope, so zooming into a narrow band is defensible
 * here in a way it never is for bars — but it still steepens every slope, so
 * say so in the caption.
 */
export const ZoomedRange: Story = {
  args: {
    label: 'Weekly sign-ups (axis starts at 100, not 0)',
    data: signups,
    includeZero: false,
  },
};

/** A single point has no line to draw — just its marker. */
export const SinglePoint: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: [{ label: 'W1', value: 120 }],
  },
};

export const EmptySeries: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: [],
  },
};

/** Values printed above each point. Off by default — labels collide once there are many categories. */
export const WithDataLabels: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    showDataLabels: true,
    showGrid: false,
  },
};

/** Hover a point for the readout; `renderTooltip` replaces the default body. */
export const CustomTooltip: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    renderTooltip: (datum, index) => (
      <>
        <strong>{datum.label}</strong> — {datum.value} sign-ups
        {index > 0
          ? ` (${datum.value - signups[index - 1]!.value >= 0 ? '+' : ''}${datum.value - signups[index - 1]!.value})`
          : ''}
      </>
    ),
  },
};

export const WithoutTooltip: Story = {
  args: {
    label: 'Weekly sign-ups',
    data: signups,
    showTooltip: false,
  },
};

const mockAIClient: AIClient = {
  complete: async () =>
    'Sign-ups trend upward across the six weeks, from 120 to 233, peaking at 264 in week 5. Growth is not steady — weeks 3 and 6 both dipped against the preceding week.',
};

/**
 * `aiExplain` lives on `ChartContainer`, so every chart inherits it. It is a
 * no-op without an ancestor `AIProvider` — this story supplies a
 * deterministic mock so the trigger appears.
 */
export const WithAIExplain: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    aiExplain: true,
    label: 'Weekly sign-ups',
    description: 'New accounts created, by ISO week.',
    data: signups,
  },
};
