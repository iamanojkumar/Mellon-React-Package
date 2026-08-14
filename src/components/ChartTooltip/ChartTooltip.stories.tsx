import type { Meta, StoryObj } from '@storybook/react';
import { ChartTooltip } from './ChartTooltip';

const meta = {
  title: 'Charts/ChartTooltip',
  component: ChartTooltip,
  parameters: { layout: 'padded' },
  // The tooltip anchors in percentages of a positioned box, so every story
  // needs one to sit in — the charts supply this themselves.
  decorators: [
    (Story) => (
      <div
        style={{
          position: 'relative',
          height: 200,
          border: 'var(--ds-border-width-thin) dashed var(--ds-chart-grid)',
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartTooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    x: 50,
    y: 60,
    children: 'Apr — $66k',
  },
};

/** Near the left edge it anchors from the left instead of centring, so it can't clip. */
export const NearLeftEdge: Story = {
  args: {
    x: 4,
    y: 60,
    children: 'Jan — $32k',
  },
};

export const NearRightEdge: Story = {
  args: {
    x: 96,
    y: 60,
    children: 'Jun — $39k',
  },
};

/** Any content, not just a string — the charts expose this as `renderTooltip`. */
export const RichContent: Story = {
  args: {
    x: 50,
    y: 70,
    children: (
      <>
        <strong>April</strong>
        <br />
        $66,000 — up 21% on March
      </>
    ),
  },
};
