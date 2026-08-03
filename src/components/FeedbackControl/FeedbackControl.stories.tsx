import type { Meta, StoryObj } from '@storybook/react';
import { FeedbackControl } from './FeedbackControl';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof FeedbackControl> = {
  title: 'AI Chat/FeedbackControl',
  component: FeedbackControl,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FeedbackControl>;

export const Default: Story = {
  render: () => <FeedbackControl />,
};

export const WithReport: Story = {
  args: {
    onReport: () => alert('Reported'),
  },
};

export const Pressed: Story = {
  args: {
    defaultValue: 'up',
  },
};

export const BelowAMessageBubble: Story = {
  render: () => (
    <Stack gap="xs">
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        Use `display: flex` with `align-items: center` and `justify-content: center`.
      </MessageBubble>
      <FeedbackControl onReport={() => {}} />
    </Stack>
  ),
};
