import type { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof Code> = {
  title: 'Typography/Code',
  component: Code,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Inline: Story = {
  render: () => (
    <p>
      Run <Code>pnpm install</Code> to install dependencies.
    </p>
  ),
};

export const Block: Story = {
  render: () => (
    <Code as="pre" block>
      {'pnpm generate:component Buttons Button'}
    </Code>
  ),
};

const mockAIClient: AIClient = {
  complete: async () =>
    'This declares a constant named x and assigns it the number 1. Because it uses const, x can never be reassigned afterward.',
};

/**
 * `aiExplain` is a no-op without an ancestor `AIProvider` — this story wraps
 * a deterministic mock client so the "Explain with AI" trigger actually
 * appears. Read-only, same shape as `Alert`'s `aiExplain`: no accept/reject,
 * just an explanation.
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
    <Code as="pre" block aiExplain>
      {'const x = 1;'}
    </Code>
  ),
};
