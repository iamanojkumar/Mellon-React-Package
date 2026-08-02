import type { Meta, StoryObj } from '@storybook/react';
import { AISuggestionPopover } from './AISuggestionPopover';

const meta: Meta<typeof AISuggestionPopover> = {
  title: 'AI/AISuggestionPopover',
  component: AISuggestionPopover,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AISuggestionPopover>;

export const Idle: Story = {
  args: {
    triggerLabel: 'Rewrite with AI',
    status: 'idle',
    result: '',
  },
};

export const Loading: Story = {
  args: {
    triggerLabel: 'Rewrite with AI',
    status: 'loading',
    result: '',
    defaultOpen: true,
  },
};

export const Streaming: Story = {
  args: {
    triggerLabel: 'Rewrite with AI',
    status: 'streaming',
    result: 'The quarterly results show a marked improvement in...',
    defaultOpen: true,
  },
};

export const Done: Story = {
  args: {
    triggerLabel: 'Rewrite with AI',
    status: 'done',
    result:
      'The quarterly results show a marked improvement in customer retention, driven primarily by the new onboarding flow.',
    defaultOpen: true,
  },
};

export const ReadOnlyExplanation: Story = {
  name: 'Done (read-only, no accept/reject)',
  args: {
    triggerLabel: 'Explain with AI',
    status: 'done',
    result: 'This error occurs when the request times out before the server responds.',
    defaultOpen: true,
  },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    triggerLabel: 'Rewrite with AI',
    status: 'error',
    result: '',
    error: 'The AI request failed. Please try again.',
    defaultOpen: true,
  },
};
