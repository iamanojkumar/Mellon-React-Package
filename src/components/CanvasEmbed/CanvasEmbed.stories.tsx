import type { Meta, StoryObj } from '@storybook/react';
import { CanvasEmbed } from './CanvasEmbed';

const meta: Meta<typeof CanvasEmbed> = {
  title: 'Canvas/CanvasEmbed',
  component: CanvasEmbed,
  decorators: [
    (Story) => (
      <div style={{ width: '22rem', height: '12rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasEmbed>;

/**
 * Content is sandboxed with `allow-scripts` but deliberately without
 * `allow-same-origin` — granting both is equivalent to no sandbox at all,
 * since the frame could then strip its own sandbox attribute.
 */
export const InlineHtml: Story = {
  args: {
    title: 'Inline HTML',
    html: '<body style="font-family:sans-serif;padding:12px">Sandboxed content.</body>',
  },
};

export const Empty: Story = { args: { title: 'Nothing embedded' } };
