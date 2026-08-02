import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof TextArea> = {
  title: 'Inputs/TextArea',
  component: TextArea,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    'aria-label': 'Bio',
    placeholder: 'Tell us about yourself…',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Bio',
    defaultValue: 'Too short',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Bio',
    defaultValue: 'Can’t edit this',
    disabled: true,
  },
};

export const Rows: Story = {
  args: {
    'aria-label': 'Bio',
    rows: 8,
    placeholder: 'A taller textarea…',
  },
};

const mockAIClient: AIClient = {
  complete: async ({ prompt }) =>
    `Rewritten: ${prompt.split('\n\n')[1] ?? prompt}. Now clearer and more concise.`,
};

/**
 * `aiRewrite` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Rewrite with AI" trigger
 * actually appears. Click it to open the suggestion popover.
 */
export const WithAIRewrite: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    'aria-label': 'Bio',
    defaultValue: 'i think this product is pretty good and people should use it',
    aiRewrite: true,
  },
};
