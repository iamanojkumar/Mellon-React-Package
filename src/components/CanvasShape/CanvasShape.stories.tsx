import type { Meta, StoryObj } from '@storybook/react';
import { CanvasShape } from './CanvasShape';

const meta: Meta<typeof CanvasShape> = {
  title: 'Canvas/CanvasShape',
  component: CanvasShape,
  decorators: [
    (Story) => (
      <div style={{ width: '10rem', height: '7rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasShape>;

export const Default: Story = { args: { text: 'Process' } };

/** Labels are real text, so they wrap and inherit type tokens — an SVG <text> would not. */
export const AllShapes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)' }}>
      {(['rectangle', 'ellipse', 'diamond', 'triangle', 'parallelogram'] as const).map((shape) => (
        <div key={shape} style={{ width: '9rem', height: '7rem' }}>
          <CanvasShape shape={shape} text={shape} />
        </div>
      ))}
    </div>
  ),
};

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)' }}>
      {(['neutral', 'brand', 'success', 'warning', 'danger'] as const).map((tone) => (
        <div key={tone} style={{ width: '8rem', height: '6rem' }}>
          <CanvasShape tone={tone} text={tone} />
        </div>
      ))}
    </div>
  ),
};
