import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';
import type { AvatarSize } from './Avatar';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const meta: Meta<typeof Avatar> = {
  title: 'Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  render: () => <Avatar name="Ada Lovelace" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <Avatar key={size} name="Ada Lovelace" size={size} />
      ))}
    </div>
  ),
};

export const Square: Story = {
  render: () => <Avatar name="Ada Lovelace" shape="square" />,
};
