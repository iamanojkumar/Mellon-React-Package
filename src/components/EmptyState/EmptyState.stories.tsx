import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Data Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => <EmptyState title="No results found" />,
};

export const WithDescriptionAndAction: Story = {
  render: () => (
    <EmptyState
      icon={<span style={{ fontSize: 40 }}>📭</span>}
      title="No messages yet"
      description="When you receive a message, it will show up here."
      action={<button type="button">Compose a message</button>}
    />
  ),
};
