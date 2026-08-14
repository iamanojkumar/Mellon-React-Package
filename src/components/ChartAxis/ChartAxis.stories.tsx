import type { Meta, StoryObj } from '@storybook/react';
import { ChartAxis } from './ChartAxis';

const meta = {
  title: 'Charts/ChartAxis',
  component: ChartAxis,
  parameters: { layout: 'padded' },
  // An axis is an SVG fragment, so every story needs a canvas to sit in.
  decorators: [
    (Story) => (
      <svg aria-hidden="true" viewBox="0 0 320 200" width="320" height="200">
        <g transform="translate(48, 16)">
          <Story />
        </g>
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartAxis>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The value axis: labels sit outside the plot, right-aligned to the line. */
export const Left: Story = {
  args: {
    orientation: 'left',
    length: 152,
    ticks: [
      { position: 0, label: '80' },
      { position: 38, label: '60' },
      { position: 76, label: '40' },
      { position: 114, label: '20' },
      { position: 152, label: '0' },
    ],
  },
};

/** The category axis, positioned by the caller at the foot of the plot. */
export const Bottom: Story = {
  args: {
    orientation: 'bottom',
    length: 256,
    transform: 'translate(0, 168)',
    ticks: [
      { position: 32, label: 'Jan' },
      { position: 96, label: 'Feb' },
      { position: 160, label: 'Mar' },
      { position: 224, label: 'Apr' },
    ],
  },
};

/** Labels without the rule, for a plot that leans on its gridlines instead. */
export const WithoutLine: Story = {
  args: {
    ...Left.args,
    hideLine: true,
  },
};
