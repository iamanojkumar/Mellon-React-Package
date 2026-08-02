import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PinInput } from './PinInput';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof PinInput> = {
  title: 'Inputs/PinInput',
  component: PinInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PinInput>;

export const Default: Story = {
  args: {
    'aria-label': 'PIN',
  },
};

export const SixDigits: Story = {
  args: {
    'aria-label': 'PIN',
    length: 6,
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'PIN',
    defaultValue: '12',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'PIN',
    defaultValue: '1234',
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      const [completed, setCompleted] = useState('');
      return (
        <Stack gap="xs">
          <PinInput aria-label="PIN" value={value} onChange={setValue} onComplete={setCompleted} />
          <Text size="sm" color="secondary">
            Digits entered: {value.length}/4 — Completed: {completed || '(not yet)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
