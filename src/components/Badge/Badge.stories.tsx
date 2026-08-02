import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';
import type { BadgeColor } from './Badge';

const COLORS: BadgeColor[] = ['neutral', 'brand', 'success', 'warning', 'danger'];

const meta: Meta<typeof Badge> = {
  title: 'Data Display/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  render: () => <Badge>New</Badge>,
};

export const Subtle: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)' }}>
      {COLORS.map((color) => (
        <Badge key={color} color={color}>
          {color}
        </Badge>
      ))}
    </div>
  ),
};

export const Solid: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)' }}>
      {COLORS.map((color) => (
        <Badge key={color} color={color} variant="solid">
          {color}
        </Badge>
      ))}
    </div>
  ),
};
