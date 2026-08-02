import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from './AspectRatio';

const meta: Meta<typeof AspectRatio> = {
  title: 'Foundations/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

function Placeholder() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--ds-color-surface-secondary)',
      }}
    >
      16:9
    </div>
  );
}

export const Square: Story = {
  render: () => (
    <AspectRatio style={{ maxWidth: 240 }}>
      <Placeholder />
    </AspectRatio>
  ),
};

export const Widescreen: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} style={{ maxWidth: 320 }}>
      <Placeholder />
    </AspectRatio>
  ),
};
