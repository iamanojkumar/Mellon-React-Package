import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Heading } from '../Heading/Heading';
import type { CardElevation } from './Card';

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
