import type { Meta, StoryObj } from '@storybook/react';
import { CanvasFrame } from './CanvasFrame';

const meta: Meta<typeof CanvasFrame> = {
  title: 'Canvas/CanvasFrame',
  component: CanvasFrame,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '24rem', height: '10rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasFrame>;

/** Membership is geometric, not parental — blocks inside the rect belong to it. */
export const Default: Story = { args: { title: 'Onboarding' } };

export const Tones: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--ds-space-md)' }}>
      {(['neutral', 'brand', 'danger'] as const).map((tone) => (
        <div key={tone} style={{ position: 'relative', height: '5rem' }}>
          <CanvasFrame tone={tone} title={`${tone} frame`} />
        </div>
      ))}
    </div>
  ),
};
