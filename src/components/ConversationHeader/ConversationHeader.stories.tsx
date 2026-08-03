import type { Meta, StoryObj } from '@storybook/react';
import { ConversationHeader } from './ConversationHeader';
import { AvatarGroup } from '../AvatarGroup/AvatarGroup';
import { Avatar } from '../Avatar/Avatar';
import { IconButton } from '../IconButton/IconButton';

const meta: Meta<typeof ConversationHeader> = {
  title: 'AI Chat/ConversationHeader',
  component: ConversationHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConversationHeader>;

export const Default: Story = {
  args: {
    title: 'Centering a div with flexbox',
  },
};

export const WithModelAndTags: Story = {
  args: {
    title: 'Centering a div with flexbox',
    modelUsed: 'GPT-4',
    tags: ['css', 'layout'],
  },
};

export const Full: Story = {
  render: () => (
    <ConversationHeader
      title="Centering a div with flexbox"
      modelUsed="GPT-4"
      tags={['css', 'layout']}
      participants={
        <AvatarGroup max={3} size="sm">
          <Avatar name="Alex Chen" />
          <Avatar name="Jordan Lee" />
        </AvatarGroup>
      }
      actions={
        <IconButton aria-label="More options" variant="ghost">
          <svg viewBox="0 0 20 20" width="1.2em" height="1.2em" aria-hidden="true">
            <circle cx="4" cy="10" r="1.4" fill="currentColor" />
            <circle cx="10" cy="10" r="1.4" fill="currentColor" />
            <circle cx="16" cy="10" r="1.4" fill="currentColor" />
          </svg>
        </IconButton>
      }
    />
  ),
};
