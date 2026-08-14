import type { Meta, StoryObj } from '@storybook/react';
import { CanvasOutline } from './CanvasOutline';
import type { CanvasScene } from '../../utilities/canvasReducer';

const scene: CanvasScene = {
  blocks: [
    {
      id: 'a',
      kind: 'sticky',
      text: 'Users bounce after SSO',
      x: 0,
      y: 0,
      width: 150,
      height: 110,
    },
    { id: 'b', kind: 'sticky', text: 'Add a retry banner', x: 200, y: 0, width: 150, height: 110 },
    {
      id: 'c',
      kind: 'shape',
      shape: 'diamond',
      text: 'Token valid?',
      x: 0,
      y: 200,
      width: 130,
      height: 130,
    },
  ],
  connectors: [
    { id: 'e1', from: 'a', to: 'b' },
    { id: 'e2', from: 'b', to: 'c' },
  ],
};

const meta: Meta<typeof CanvasOutline> = {
  title: 'Canvas/CanvasOutline',
  component: CanvasOutline,
  args: { scene, visible: true },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '22rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasOutline>;

/**
 * Not a convenience view: the canvas's spatial rendering is `aria-hidden`, so
 * this list *is* its accessible content — reading order, kinds, and every
 * connection stated as text.
 */
export const Default: Story = {};

export const Empty: Story = { args: { scene: { blocks: [], connectors: [] } } };
