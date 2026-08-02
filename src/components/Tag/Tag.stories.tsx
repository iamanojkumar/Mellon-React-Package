import type { Meta, StoryObj } from '@storybook/react';
import { Tag } from './Tag';
import type { TagColor } from './Tag';

const COLORS: TagColor[] = ['neutral', 'brand', 'success', 'warning', 'danger'];

const meta: Meta<typeof Tag> = {
  title: 'Data Display/Tag',
  component: Tag,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-xs)' }}>
      {COLORS.map((color) => (
        <Tag key={color} color={color}>
          {color}
        </Tag>
      ))}
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Tag as="a" href="#" color="brand">
      clickable-tag
    </Tag>
  ),
};
