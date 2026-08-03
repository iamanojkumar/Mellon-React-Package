import type { Meta, StoryObj } from '@storybook/react';
import { MessageActionBar } from './MessageActionBar';
import { Stack } from '../Stack/Stack';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof MessageActionBar> = {
  title: 'AI Chat/MessageActionBar',
  component: MessageActionBar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MessageActionBar>;

export const Default: Story = {
  args: {
    onCopy: () => alert('Copied'),
    onRegenerate: () => alert('Regenerating'),
    onContinue: () => alert('Continuing'),
    onSimplify: () => alert('Simplifying'),
    onExplain: () => alert('Explaining'),
  },
};

export const WithExtraActions: Story = {
  args: {
    onCopy: () => {},
    extraActions: [
      { id: 'translate', label: 'Translate', onClick: () => alert('Translating') },
      { id: 'summarize', label: 'Summarize', onClick: () => alert('Summarizing') },
    ],
  },
};

export const BelowAMessageBubble: Story = {
  render: () => (
    <Stack gap="xs">
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        Use `display: flex` with `align-items: center` and `justify-content: center`.
      </MessageBubble>
      <MessageActionBar onCopy={() => {}} onRegenerate={() => {}} onExplain={() => {}} />
    </Stack>
  ),
};
