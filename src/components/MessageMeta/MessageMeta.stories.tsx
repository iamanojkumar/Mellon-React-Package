import type { Meta, StoryObj } from '@storybook/react';
import { MessageMeta } from './MessageMeta';
import { Stack } from '../Stack/Stack';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof MessageMeta> = {
  title: 'AI Chat/MessageMeta',
  component: MessageMeta,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageMeta>;

export const Default: Story = {
  args: {
    sender: 'Jordan Lee',
    timestamp: '2 minutes ago',
  },
};

export const SenderOnly: Story = {
  args: {
    sender: 'Mellon AI',
  },
};

export const WithDateTimestamp: Story = {
  args: {
    sender: 'Jordan Lee',
    timestamp: new Date(),
  },
};

export const AboveAMessageBubble: Story = {
  render: () => (
    <Stack gap="xs">
      <MessageMeta sender="Mellon AI" timestamp="2 minutes ago" />
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        Use `display: flex` with `align-items: center` and `justify-content: center`.
      </MessageBubble>
    </Stack>
  ),
};
