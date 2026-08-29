import { useEffect, useState } from 'react';
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

export const Thinking: Story = {
  args: {
    thinking: true,
    children: 'Reasoning is still streaming in…',
  },
};

export const Thought: Story = {
  args: {
    duration: 8,
    children: 'The trace that produced the answer below.',
  },
};

export const LongerThanAMinute: Story = {
  args: {
    duration: 95,
    children: 'A long research trace.',
  },
};

/**
 * The real lifecycle: `thinking` flips off after three seconds and the label
 * settles to the elapsed time the block measured itself.
 */
export const ThinkingThenThought: Story = {
  render: () => {
    function Demo() {
      const [thinking, setThinking] = useState(true);
      useEffect(() => {
        const id = window.setTimeout(() => setThinking(false), 3000);
        return () => window.clearTimeout(id);
      }, []);
      return (
        <Stack gap="xs">
          <ThinkingBlock thinking={thinking}>
            Checked whether flexbox or grid better fits a single centered element — flexbox wins for
            broad support and simplicity.
          </ThinkingBlock>
          {!thinking && (
            <MessageBubble variant="ai" avatar={<Avatar name="Mellon AI" size="sm" />}>
              Use `display: flex` with `align-items: center` and `justify-content: center`.
            </MessageBubble>
          )}
        </Stack>
      );
    }
    return <Demo />;
  },
};
