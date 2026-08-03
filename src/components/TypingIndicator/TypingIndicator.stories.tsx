import type { Meta, StoryObj } from '@storybook/react';
import { TypingIndicator } from './TypingIndicator';
import type { TypingIndicatorSize } from './TypingIndicator';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';

const SIZES: TypingIndicatorSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof TypingIndicator> = {
  title: 'AI Chat/TypingIndicator',
  component: TypingIndicator,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TypingIndicator>;

export const Default: Story = {
  render: () => <TypingIndicator />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <TypingIndicator key={size} size={size} />
      ))}
    </div>
  ),
};

export const InsideAMessageBubble: Story = {
  render: () => (
    <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
      <TypingIndicator label="Mellon AI is typing" />
    </MessageBubble>
  ),
};
