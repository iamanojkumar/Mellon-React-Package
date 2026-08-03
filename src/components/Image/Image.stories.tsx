import type { Meta, StoryObj } from '@storybook/react';
import { Image } from './Image';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof Image> = {
  title: 'Media/Image',
  component: Image,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Image>;

const SRC = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400';

export const Default: Story = {
  render: () => <Image src={SRC} alt="Mountain landscape" style={{ width: 240 }} />,
};

export const WithRatioAndRounded: Story = {
  render: () => (
    <Image src={SRC} alt="Mountain landscape" ratio={16 / 9} rounded style={{ width: 320 }} />
  ),
};

export const ObjectFitContain: Story = {
  render: () => (
    <div style={{ width: 240, height: 160, background: 'var(--ds-color-surface-secondary)' }}>
      <Image
        src={SRC}
        alt="Mountain landscape"
        fit="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  ),
};

const mockAIClient: AIClient = {
  complete: async () => 'A mountain landscape with a lake in the foreground at golden hour.',
};

/**
 * `aiDescribe` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Describe with AI" trigger
 * actually appears. Read-only: no accept/reject, `alt` stays required and
 * explicit — this only suggests text for a human to copy in.
 */
export const WithAIDescribe: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  render: () => <Image src={SRC} alt="Mountain landscape" style={{ width: 240 }} aiDescribe />,
};
