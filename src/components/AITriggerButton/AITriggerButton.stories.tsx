import type { Meta, StoryObj } from '@storybook/react';
import { AITriggerButton } from './AITriggerButton';

const meta: Meta<typeof AITriggerButton> = {
  title: 'AI/AITriggerButton',
  component: AITriggerButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AITriggerButton>;

export const Default: Story = {
  args: {
    'aria-label': 'Rewrite with AI',
  },
};

export const Loading: Story = {
  args: {
    'aria-label': 'Rewrite with AI',
    status: 'loading',
  },
};

export const Streaming: Story = {
  args: {
    'aria-label': 'Rewrite with AI',
    status: 'streaming',
  },
};

export const Done: Story = {
  args: {
    'aria-label': 'Rewrite with AI',
    status: 'done',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Rewrite with AI',
    disabled: true,
  },
};
