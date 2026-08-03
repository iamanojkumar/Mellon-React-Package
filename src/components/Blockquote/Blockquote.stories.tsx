import type { Meta, StoryObj } from '@storybook/react';
import { Blockquote } from './Blockquote';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof Blockquote> = {
  title: 'Typography/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Blockquote>;

export const Default: Story = {
  render: () => (
    <Blockquote style={{ maxWidth: 400 }}>
      Design is not just what it looks like and feels like. Design is how it works.
    </Blockquote>
  ),
};

const mockAIClient: AIClient = {
  complete: async () =>
    'This quote, often attributed to Steve Jobs, argues that good design is inseparable from how well something functions, not just its surface appearance.',
};

/**
 * `aiExplain` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Explain with AI" trigger
 * actually appears. Read-only: no accept/reject, just an explanation.
 */
export const WithAIExplain: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  render: () => (
    <Blockquote style={{ maxWidth: 400 }} aiExplain>
      Design is not just what it looks like and feels like. Design is how it works.
    </Blockquote>
  ),
};
