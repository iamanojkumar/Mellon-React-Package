import type { Meta, StoryObj } from '@storybook/react';
import { HoverCard } from './HoverCard';
import { Avatar } from '../Avatar/Avatar';
import { Text } from '../Text/Text';
import { Stack } from '../Stack/Stack';
import { Flex } from '../Flex/Flex';

const meta: Meta<typeof HoverCard> = {
  title: 'Overlays/HoverCard',
  component: HoverCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCard.Trigger as="a" href="#profile">
        @ada
      </HoverCard.Trigger>
      <HoverCard.Content>
        <Flex gap="sm" align="center" style={{ width: 220 }}>
          <Avatar name="Ada Lovelace" />
          <Stack gap="none">
            <Text weight="bold" size="sm">
              Ada Lovelace
            </Text>
            <Text size="xs" color="secondary">
              Mathematician &amp; writer
            </Text>
          </Stack>
        </Flex>
      </HoverCard.Content>
    </HoverCard>
  ),
};

/** Content stays open while the pointer moves from the trigger into the card — useful since a hover card's content is often itself interactive (a link, a follow button). */
export const InteractiveContent: Story = {
  render: () => (
    <HoverCard closeDelay={300}>
      <HoverCard.Trigger as="a" href="#profile">
        @grace
      </HoverCard.Trigger>
      <HoverCard.Content>
        <Stack gap="sm" style={{ width: 220 }}>
          <Text weight="bold" size="sm">
            Grace Hopper
          </Text>
          <Text size="xs" color="secondary">
            Computer scientist &amp; Navy rear admiral
          </Text>
          <a href="#profile">View profile</a>
        </Stack>
      </HoverCard.Content>
    </HoverCard>
  ),
};
