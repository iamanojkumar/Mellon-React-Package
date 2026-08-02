import type { Meta, StoryObj } from '@storybook/react';
import { CircularProgress } from './CircularProgress';

const meta: Meta<typeof CircularProgress> = {
  title: 'Feedback/CircularProgress',
  component: CircularProgress,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CircularProgress>;

export const Determinate: Story = {
  render: () => <CircularProgress value={65} label="Upload progress" />,
};

export const Indeterminate: Story = {
  render: () => <CircularProgress label="Loading" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)', alignItems: 'center' }}>
      <CircularProgress value={50} size="sm" />
      <CircularProgress value={50} size="md" />
      <CircularProgress value={50} size="lg" />
    </div>
  ),
};
