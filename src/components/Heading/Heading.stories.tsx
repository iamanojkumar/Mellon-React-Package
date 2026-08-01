import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from './Heading';
import { Stack } from '../Stack/Stack';
import type { HeadingLevel } from './Heading';

const LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

const meta: Meta<typeof Heading> = {
  title: 'Typography/Heading',
  component: Heading,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Heading>;

export const Default: Story = {
  args: {
    level: 1,
    children: 'Heading content',
  },
};

export const Levels: Story = {
  render: () => (
    <Stack gap="sm">
      {LEVELS.map((level) => (
        <Heading key={level} level={level}>
          Heading level {level}
        </Heading>
      ))}
    </Stack>
  ),
};

export const OverriddenSize: Story = {
  render: () => (
    <Heading level={2} size="xs">
      Level 2, sized down to xs
    </Heading>
  ),
};
