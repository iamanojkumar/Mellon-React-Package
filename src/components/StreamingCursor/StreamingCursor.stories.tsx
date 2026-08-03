import type { Meta, StoryObj } from '@storybook/react';
import { StreamingCursor } from './StreamingCursor';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof StreamingCursor> = {
  title: 'AI Chat/StreamingCursor',
  component: StreamingCursor,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StreamingCursor>;

export const Default: Story = {
  render: () => (
    <span>
      Some streamed text
      <StreamingCursor />
    </span>
  ),
};

export const InsideAMessageBubble: Story = {
  render: () => (
    <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
      Use `display: flex` with `align-items: center`
      <StreamingCursor />
    </MessageBubble>
  ),
};
