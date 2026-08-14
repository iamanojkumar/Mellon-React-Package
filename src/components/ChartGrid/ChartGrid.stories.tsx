import type { Meta, StoryObj } from '@storybook/react';
import { ChartGrid } from './ChartGrid';

const meta = {
  title: 'Charts/ChartGrid',
  component: ChartGrid,
  parameters: { layout: 'padded' },
  // A grid is an SVG fragment, so every story needs a canvas to sit in.
  decorators: [
    (Story) => (
      <svg aria-hidden="true" viewBox="0 0 320 200" width="320" height="200">
        <g transform="translate(16, 16)">
          <Story />
        </g>
      </svg>
    ),
  ],
} satisfies Meta<typeof ChartGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The usual case: reference lines at the value-axis ticks. */
export const Horizontal: Story = {
  args: {
    positions: [0, 42, 84, 126, 168],
    length: 288,
  },
};

/** For a plot read across time rather than up a value scale. */
export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    positions: [0, 72, 144, 216, 288],
    length: 168,
  },
};
