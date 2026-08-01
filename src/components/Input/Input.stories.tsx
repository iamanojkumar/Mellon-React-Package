import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Input } from './Input';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import type { InputSize } from './Input';

const SIZES: InputSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof Input> = {
  title: 'Inputs/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    'aria-label': 'Name',
    placeholder: 'Type something…',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="sm" style={{ maxWidth: 240 }}>
      {SIZES.map((size) => (
        <Input key={size} aria-label={`${size} input`} size={size} placeholder={size} />
      ))}
    </Stack>
  ),
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Email',
    defaultValue: 'not-an-email',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Name',
    defaultValue: 'Can’t edit this',
    disabled: true,
  },
};

export const Uncontrolled: Story = {
  render: () => <Input aria-label="Name" defaultValue="Starts with this value" />,
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 240 }}>
          <Input
            aria-label="Name"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Type something…"
          />
          <Text size="sm" color="secondary">
            Value: {value || '(empty)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
