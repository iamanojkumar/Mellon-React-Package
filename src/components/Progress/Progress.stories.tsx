import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Feedback/Progress',
  component: Progress,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Determinate: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <Progress value={65} label="Upload progress" />
    </div>
  ),
};

export const Indeterminate: Story = {
  render: () => (
    <div style={{ width: 240 }}>
      <Progress label="Loading" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div
      style={{ width: 240, display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-sm)' }}
    >
      <Progress value={50} size="sm" />
      <Progress value={50} size="md" />
      <Progress value={50} size="lg" />
    </div>
  ),
};
