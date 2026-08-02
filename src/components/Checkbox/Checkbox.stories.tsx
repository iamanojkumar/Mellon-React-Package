import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Checkbox> = {
  title: 'Inputs/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {
    label: 'Accept terms and conditions',
  },
};

export const Checked: Story = {
  args: {
    label: 'Subscribed to newsletter',
    defaultChecked: true,
  },
};

export const Indeterminate: Story = {
  args: {
    label: 'Select all',
    indeterminate: true,
  },
};

export const Invalid: Story = {
  args: {
    label: 'I agree (required)',
    invalid: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <Stack gap="sm">
      <Checkbox label="Disabled, unchecked" disabled />
      <Checkbox label="Disabled, checked" disabled defaultChecked />
    </Stack>
  ),
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [checked, setChecked] = useState(false);
      return (
        <Checkbox
          label={checked ? 'Checked' : 'Unchecked'}
          checked={checked}
          onCheckedChange={setChecked}
        />
      );
    }
    return <Demo />;
  },
};
