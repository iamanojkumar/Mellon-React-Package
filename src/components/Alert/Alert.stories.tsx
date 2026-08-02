import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Alert } from './Alert';
import { Stack } from '../Stack/Stack';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: 'Heads up',
    children: 'This is an informational message.',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="sm">
      <Alert variant="info" title="Info">
        A neutral, informational message.
      </Alert>
      <Alert variant="success" title="Success">
        Your changes were saved.
      </Alert>
      <Alert variant="warning" title="Warning">
        Your session will expire in 5 minutes.
      </Alert>
      <Alert variant="danger" title="Error">
        Something went wrong. Please try again.
      </Alert>
    </Stack>
  ),
};

export const WithoutTitle: Story = {
  args: {
    variant: 'success',
    children: 'A one-line alert with no title.',
  },
};

export const Dismissible: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      if (!visible) return null;
      return (
        <Alert variant="warning" title="Storage almost full" onDismiss={() => setVisible(false)}>
          You&apos;re using 92% of your available storage.
        </Alert>
      );
    }
    return <Demo />;
  },
};

const mockAIClient: AIClient = {
  complete: async () =>
    'This happens when the upstream service takes too long to respond. It usually resolves itself — try again in a moment, or check the status page if it persists.',
};

/**
 * `aiExplain` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Explain with AI" trigger
 * actually appears. Unlike the rewrite/search flagships, this is read-only:
 * no accept/reject actions, just an explanation.
 */
export const WithAIExplain: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    variant: 'danger',
    title: 'Request failed',
    children: 'The request timed out after 30 seconds.',
    aiExplain: true,
  },
};
