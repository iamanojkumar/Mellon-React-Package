import type { Meta, StoryObj } from '@storybook/react';
import { Statistic } from './Statistic';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof Statistic> = {
  title: 'Data Display/Statistic',
  component: Statistic,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Statistic>;

export const Default: Story = {
  render: () => <Statistic label="Monthly Revenue" value="$48,290" />,
};

export const WithTrend: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-xl)' }}>
      <Statistic label="Signups" value="1,204" trend="up" trendValue="+8.2%" />
      <Statistic label="Churn" value="3.1%" trend="down" trendValue="-0.4%" />
      <Statistic label="Active Users" value="9,842" trend="neutral" trendValue="0.0%" />
    </div>
  ),
};

const mockAIClient: AIClient = {
  complete: async () =>
    'Signups grew 8.2% mostly from an increase in mobile referral traffic this week.',
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
  render: () => <Statistic label="Signups" value="1,204" trend="up" trendValue="+8.2%" aiExplain />,
};
