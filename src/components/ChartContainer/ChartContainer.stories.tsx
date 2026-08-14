import type { Meta, StoryObj } from '@storybook/react';
import { ChartContainer } from './ChartContainer';

const data = [
  { label: 'Jan', value: 32 },
  { label: 'Feb', value: 48 },
  { label: 'Mar', value: 21 },
  { label: 'Apr', value: 66 },
];

/** Stand-in for a real plot until BarChart/LineChart land. */
function PlaceholderPlot() {
  return (
    <svg viewBox="0 0 320 160" width="100%" height="160" aria-hidden="true">
      {data.map((datum, index) => (
        <rect
          key={datum.label}
          x={index * 80 + 16}
          y={160 - datum.value * 2}
          width={48}
          height={datum.value * 2}
          rx={4}
          fill="var(--ds-chart-primary)"
        />
      ))}
    </svg>
  );
}

const meta = {
  title: 'Charts/ChartContainer',
  component: ChartContainer,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Monthly revenue',
    data,
    children: <PlaceholderPlot />,
  },
};

export const WithDescription: Story = {
  args: {
    label: 'Monthly revenue',
    description: 'In thousands of USD, before tax.',
    data,
    children: <PlaceholderPlot />,
  },
};

/** The table is always in the accessibility tree; this makes it visible too. */
export const WithTableToggle: Story = {
  args: {
    label: 'Monthly revenue',
    data,
    tableToggle: true,
    children: <PlaceholderPlot />,
  },
};

export const CustomHeadingsAndFormatting: Story = {
  args: {
    label: 'Monthly revenue',
    data,
    tableToggle: true,
    categoryHeading: 'Month',
    valueHeading: 'Revenue',
    formatValue: (value: number) => `$${value},000`,
    children: <PlaceholderPlot />,
  },
};

export const EmptySeries: Story = {
  args: {
    label: 'Monthly revenue',
    data: [],
    tableToggle: true,
    children: <svg viewBox="0 0 320 160" width="100%" height="160" aria-hidden="true" />,
  },
};
