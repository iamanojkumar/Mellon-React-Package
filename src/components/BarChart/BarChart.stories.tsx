import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from './BarChart';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const revenue = [
  { label: 'Jan', value: 32 },
  { label: 'Feb', value: 48 },
  { label: 'Mar', value: 21 },
  { label: 'Apr', value: 66 },
  { label: 'May', value: 54 },
  { label: 'Jun', value: 39 },
];

const meta = {
  title: 'Charts/BarChart',
  component: BarChart,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
  },
};

export const WithDescriptionAndFormatting: Story = {
  args: {
    label: 'Monthly revenue',
    description: 'In thousands of USD, before tax.',
    data: revenue,
    categoryHeading: 'Month',
    valueHeading: 'Revenue',
    formatValue: (value: number) => `$${value}k`,
    margin: { left: 56 },
  },
};

/** The table is always in the accessibility tree; this makes it visible too. */
export const WithTableToggle: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    tableToggle: true,
  },
};

/** Bars grow from the zero line in both directions, and it's drawn explicitly. */
export const WithNegativeValues: Story = {
  args: {
    label: 'Net change in headcount',
    data: [
      { label: 'Q1', value: 12 },
      { label: 'Q2', value: -5 },
      { label: 'Q3', value: 8 },
      { label: 'Q4', value: -14 },
    ],
  },
};

export const WithoutGrid: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    showGrid: false,
  },
};

/** Wider bands, for a chart that reads as blocks rather than columns. */
export const TightBands: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    bandPadding: 0.05,
  },
};

/**
 * `includeZero` defaults to `true` on purpose. Turning it off makes a 6%
 * spread look like a collapse — the most common way a bar chart misleads.
 */
export const ClippedBaseline: Story = {
  args: {
    label: 'Uptime (clipped baseline — do not ship this)',
    data: [
      { label: 'Mon', value: 99.1 },
      { label: 'Tue', value: 99.4 },
      { label: 'Wed', value: 98.9 },
      { label: 'Thu', value: 99.6 },
    ],
    includeZero: false,
    margin: { left: 56 },
  },
};

export const EmptySeries: Story = {
  args: {
    label: 'Monthly revenue',
    data: [],
  },
};

/** Values printed above each bar. Off by default — labels collide once there are many categories. */
export const WithDataLabels: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    showDataLabels: true,
    showGrid: false,
  },
};

/** Hover a bar for the readout; `renderTooltip` replaces the default body. */
export const CustomTooltip: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    renderTooltip: (datum) => (
      <>
        <strong>{datum.label}</strong> — ${datum.value},000
      </>
    ),
  },
};

/** A static chart, for print or a dashboard tile that shouldn't react to the pointer. */
export const WithoutTooltip: Story = {
  args: {
    label: 'Monthly revenue',
    data: revenue,
    showTooltip: false,
  },
};

const mockAIClient: AIClient = {
  complete: async ({ prompt }) =>
    prompt.includes('Q4')
      ? 'Headcount grew in the first and third quarters but fell in the second and fourth, ending the year down 1 net. The sharpest drop was Q4 at -14, more than offsetting the Q1 gain of 12.'
      : 'Revenue rose through the first half, peaking at 66 in April before easing to 39 by June. March was the weakest month at 21, roughly a third of the April high.',
};

/**
 * `aiExplain` lives on `ChartContainer`, so every chart inherits it. It is a
 * no-op without an ancestor `AIProvider` — this story supplies a
 * deterministic mock so the trigger appears. Read-only, like `Alert`'s
 * explanation: there is nothing to accept, since the data is the caller's.
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
    label: 'Monthly revenue',
    description: 'In thousands of USD, before tax.',
    data: revenue,
    tableToggle: true,
  },
};

/** The prompt is built from the series, so a chart with gaps says so rather than sending NaN. */
export const WithAIExplainAndNegatives: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    aiExplain: true,
    label: 'Net change in headcount',
    data: [
      { label: 'Q1', value: 12 },
      { label: 'Q2', value: -5 },
      { label: 'Q3', value: 8 },
      { label: 'Q4', value: -14 },
    ],
  },
};
