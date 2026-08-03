import type { Meta, StoryObj } from '@storybook/react';
import { ChartSurface } from './ChartSurface';

const meta: Meta<typeof ChartSurface> = {
  title: 'AI Chat/ChartSurface',
  component: ChartSurface,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChartSurface>;

const MONTHLY_REVENUE = [
  { label: 'Jan', value: 42 },
  { label: 'Feb', value: 58 },
  { label: 'Mar', value: 51 },
  { label: 'Apr', value: 67 },
  { label: 'May', value: 73 },
  { label: 'Jun', value: 61 },
];

export const Bar: Story = {
  args: {
    type: 'bar',
    data: MONTHLY_REVENUE,
    label: 'Monthly revenue, in thousands of USD',
  },
};

export const Line: Story = {
  args: {
    type: 'line',
    data: MONTHLY_REVENUE,
    label: 'Monthly revenue, in thousands of USD',
  },
};

export const TallerPlot: Story = {
  args: {
    type: 'bar',
    data: MONTHLY_REVENUE,
    label: 'Monthly revenue, in thousands of USD',
    height: 320,
  },
};
