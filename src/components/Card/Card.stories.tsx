import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Heading } from '../Heading/Heading';
import type { CardElevation } from './Card';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const ELEVATIONS: CardElevation[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof Card> = {
  title: 'Data Display/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

function CardBody() {
  return (
    <Stack gap="xs">
      <Heading level={3} size="sm">
        Card title
      </Heading>
      <Text size="sm" color="secondary">
        Supporting content lives here.
      </Text>
    </Stack>
  );
}

export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: 280 }}>
      <CardBody />
    </Card>
  ),
};

export const Outlined: Story = {
  render: () => (
    <Card variant="outlined" style={{ maxWidth: 280 }}>
      <CardBody />
    </Card>
  ),
};

export const Elevations: Story = {
  render: () => (
    <Stack gap="md" style={{ maxWidth: 280 }}>
      {ELEVATIONS.map((elevation) => (
        <Card key={elevation} elevation={elevation}>
          <Text size="sm">elevation: {elevation}</Text>
        </Card>
      ))}
    </Stack>
  ),
};

export const PaddingScale: Story = {
  render: () => (
    <Stack gap="sm" style={{ maxWidth: 280 }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((padding) => (
        <Card key={padding} padding={padding}>
          <Text size="sm">padding: {padding}</Text>
        </Card>
      ))}
    </Stack>
  ),
};

const mockAIClient: AIClient = {
  complete: async () =>
    'This card explains that the library is styled through CSS variables, allowing future token changes without touching component code.',
};

/**
 * `aiExplain` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so the "Explain with AI" trigger
 * actually appears. Read-only, same shape as `Alert`'s `aiExplain`: no
 * accept/reject, just a summary. Only string `children` feed the default
 * prompt, so this story uses plain text rather than `CardBody`'s
 * `Heading`/`Text` composition.
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
    <Card style={{ maxWidth: 280 }} aiExplain>
      This library is styled entirely through --ds-* CSS variables, so components never change when
      the underlying design tokens do.
    </Card>
  ),
};
