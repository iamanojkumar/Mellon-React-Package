import type { Meta, StoryObj } from '@storybook/react';
import { ThinkingBlock } from './ThinkingBlock';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { Avatar } from '../Avatar/Avatar';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof ThinkingBlock> = {
  title: 'AI Chat/ThinkingBlock',
  component: ThinkingBlock,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThinkingBlock>;

export const Default: Story = {
  args: {
    children:
      'The user asked about centering a div. Flexbox is the most broadly supported approach, so I recommended align-items and justify-content over CSS Grid alternatives.',
  },
};

export const ExpandedByDefault: Story = {
  args: {
    defaultOpen: true,
    children: 'This reasoning trace starts expanded.',
  },
};

export const AboveAMessageBubble: Story = {
  render: () => (
    <Stack gap="xs">
      <ThinkingBlock>
        Checked whether flexbox or grid better fits a single centered element — flexbox wins for
        broad support and simplicity.
      </ThinkingBlock>
      <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
        Use `display: flex` with `align-items: center` and `justify-content: center`.
      </MessageBubble>
    </Stack>
  ),
};
