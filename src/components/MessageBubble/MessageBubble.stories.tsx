import type { Meta, StoryObj } from '@storybook/react';
import { MessageBubble } from './MessageBubble';
import { Stack } from '../Stack/Stack';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof MessageBubble> = {
  title: 'AI Chat/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

export const Default: Story = {
  args: {
    children: 'How do I center a div?',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="sm">
      <MessageBubble variant="user" avatar={<Avatar name="Jordan Lee" size="sm" />}>
        How do I center a div?
      </MessageBubble>
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        Use `display: flex` with `align-items: center` and `justify-content: center`.
      </MessageBubble>
      <MessageBubble variant="system">Jordan Lee joined the conversation</MessageBubble>
      <MessageBubble variant="tool">Ran: search_docs(&quot;flexbox centering&quot;)</MessageBubble>
      <MessageBubble variant="error">The request timed out. Please try again.</MessageBubble>
      <MessageBubble variant="status">Reconnecting…</MessageBubble>
    </Stack>
  ),
};

export const Conversation: Story = {
  render: () => (
    <Stack gap="sm">
      <MessageBubble variant="user" avatar={<Avatar name="Jordan Lee" size="sm" />}>
        Can you summarize this PR?
      </MessageBubble>
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        This PR adds five new chat-conversation components: MessageBubble, MessageMeta,
        CitationMarker, TypingIndicator, and StreamingCursor.
      </MessageBubble>
    </Stack>
  ),
};
