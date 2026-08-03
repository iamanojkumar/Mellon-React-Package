import type { Meta, StoryObj } from '@storybook/react';
import { KeyValueList } from './KeyValueList';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof KeyValueList> = {
  title: 'Data Display/KeyValueList',
  component: KeyValueList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KeyValueList>;

const ORDER_ITEMS = [
  { label: 'Order ID', value: '#48213' },
  { label: 'Status', value: 'Shipped' },
  { label: 'Total', value: '$128.50' },
];

export const Default: Story = {
  render: () => <KeyValueList style={{ maxWidth: 280 }} items={ORDER_ITEMS} />,
};

const mockAIClient: AIClient = {
  complete: async () =>
    'Order #48213 has shipped and totals $128.50 — nothing further is needed from you.',
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
  render: () => <KeyValueList style={{ maxWidth: 280 }} items={ORDER_ITEMS} aiExplain />,
};
