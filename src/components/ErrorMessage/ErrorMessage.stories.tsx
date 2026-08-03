import type { Meta, StoryObj } from '@storybook/react';
import { ErrorMessage } from './ErrorMessage';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Form/ErrorMessage',
  component: ErrorMessage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorMessage>;

export const Default: Story = {
  render: () => <ErrorMessage>Enter a valid email address.</ErrorMessage>,
};

export const CustomElement: Story = {
  render: () => (
    <ErrorMessage as="span">Rendered as a span instead of the default div.</ErrorMessage>
  ),
};

const mockAIClient: AIClient = {
  complete: async () => 'The address is missing an @ symbol and a domain, e.g. name@example.com.',
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
  render: () => <ErrorMessage aiExplain>Enter a valid email address.</ErrorMessage>,
};
