import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { AIProvider } from '../../providers/AIProvider';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof EmptyState> = {
  title: 'Data Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => <EmptyState title="No results found" />,
};

export const WithDescriptionAndAction: Story = {
  render: () => (
    <EmptyState
      icon={<span style={{ fontSize: 40 }}>📭</span>}
      title="No messages yet"
      description="When you receive a message, it will show up here."
      action={<button type="button">Compose a message</button>}
    />
  ),
};

const mockAIClient: AIClient = {
  complete: async () => 'Try "invoice" instead of "invioce", or remove the date filter.',
};

/**
 * No `EmptyState` prop change needed — its existing `action` slot already
 * accepts arbitrary composed UI, so an AI-suggestions affordance is just a
 * consumer composing `AISuggestionPopover` (and its own `useAIAction`) into
 * that slot, the same way any other action button would go there.
 */
export const WithAISuggestions: Story = {
  render: () => {
    function Demo() {
      const aiAction = useAIAction();
      return (
        <EmptyState
          title="No results for “invioce march”"
          description="Try adjusting your search or filters."
          action={
            <AISuggestionPopover
              triggerLabel="Suggest a search with AI"
              status={aiAction.status}
              result={aiAction.result}
              error={aiAction.error}
              onOpenChange={(open) => {
                if (open) {
                  aiAction.trigger({ prompt: 'Suggest a corrected search for: invioce march' });
                } else {
                  aiAction.reset();
                }
              }}
              onRetry={() =>
                aiAction.trigger({ prompt: 'Suggest a corrected search for: invioce march' })
              }
            />
          }
        />
      );
    }
    return (
      <AIProvider client={mockAIClient}>
        <Demo />
      </AIProvider>
    );
  },
};
