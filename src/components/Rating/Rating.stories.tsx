import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Rating } from './Rating';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof Rating> = {
  title: 'Inputs/Rating',
  component: Rating,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Default: Story = {
  args: {
    'aria-label': 'Rating',
    defaultValue: 3,
  },
};

export const HalfStars: Story = {
  args: {
    'aria-label': 'Rating',
    defaultValue: 3.5,
    allowHalf: true,
  },
};

export const TenStars: Story = {
  args: {
    'aria-label': 'Rating',
    max: 10,
    defaultValue: 7,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Rating',
    defaultValue: 4,
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState(0);
      return (
        <Stack gap="xs" style={{ width: 240 }}>
          <Rating aria-label="Rating" value={value} onChange={setValue} allowHalf />
          <Text size="sm" color="secondary">
            Value: {value}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
