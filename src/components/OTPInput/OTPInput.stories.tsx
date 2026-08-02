import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { OTPInput } from './OTPInput';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof OTPInput> = {
  title: 'Inputs/OTPInput',
  component: OTPInput,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OTPInput>;

export const Default: Story = {
  args: {
    'aria-label': 'Verification code',
  },
};

export const FourDigits: Story = {
  args: {
    'aria-label': 'Verification code',
    length: 4,
  },
};

export const Alphanumeric: Story = {
  args: {
    'aria-label': 'Backup code',
    length: 8,
    characterType: 'alphanumeric',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Verification code',
    defaultValue: '123',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Verification code',
    defaultValue: '123456',
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
          <OTPInput
            aria-label="Verification code"
            value={value}
            onChange={setValue}
            onComplete={setCompleted}
          />
          <Text size="sm" color="secondary">
            Value: {value || '(empty)'} — Completed: {completed || '(not yet)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
