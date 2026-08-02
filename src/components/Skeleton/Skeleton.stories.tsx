import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  render: () => (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-xs)', width: 240 }}
    >
      <Skeleton />
      <Skeleton width="80%" />
      <Skeleton width="60%" />
    </div>
  ),
};

export const CardLayout: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      <Skeleton variant="circular" />
      <div
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-xs)', width: 160 }}
      >
        <Skeleton />
        <Skeleton width="70%" />
      </div>
    </div>
  ),
};

export const Rectangular: Story = {
  render: () => <Skeleton variant="rectangular" width={240} height={120} />,
};
