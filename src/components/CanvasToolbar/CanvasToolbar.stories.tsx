import type { Meta, StoryObj } from '@storybook/react';
import { CanvasToolbar } from './CanvasToolbar';

const meta: Meta<typeof CanvasToolbar> = {
  title: 'Canvas/CanvasToolbar',
  component: CanvasToolbar,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '32rem', height: '8rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasToolbar>;

/** Rendered by `Canvas` itself via `shapeToolbar` — shown standalone here since it's a screen-space overlay, not scene content. */
export const Default: Story = {
  args: { onInsert: () => {} },
};
