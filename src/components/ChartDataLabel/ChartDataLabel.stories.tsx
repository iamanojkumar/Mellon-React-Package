import type { Meta, StoryObj } from '@storybook/react';
import { ChartDataLabel } from './ChartDataLabel';

const meta = {
  title: 'Charts/ChartDataLabel',
  component: ChartDataLabel,
  parameters: { layout: 'padded' },
  // A data label is an SVG fragment, so every story needs a canvas to sit in.
  decorators: [
    (Story) => (
      <svg aria-hidden="true" viewBox="0 0 320 160" width="320" height="160">
        <rect x={120} y={60} width={80} height={60} fill="var(--ds-chart-primary)" rx={4} />
        <Story />
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartDataLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sits above the mark — the usual case, for a bar growing up from the baseline. */
export const Above: Story = {
  args: {
    x: 160,
    y: 60,
    children: '48',
  },
};

/** For a mark hanging below the baseline, so the label still clears it. */
export const Below: Story = {
  args: {
    x: 160,
    y: 120,
    placement: 'below',
    children: '-48',
  },
};
