import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from './Switch';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Switch> = {
  title: 'Inputs/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {
    label: 'Airplane mode',
  },
};

export const Checked: Story = {
  args: {
    label: 'Notifications',
    defaultChecked: true,
  },
};

export const Invalid: Story = {
  args: {
    label: 'Accept required terms',
    invalid: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <Stack gap="sm">
      <Switch label="Disabled, off" disabled />
      <Switch label="Disabled, on" disabled defaultChecked />
    </Stack>
  ),
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [checked, setChecked] = useState(false);
      return (
        <Switch label={checked ? 'On' : 'Off'} checked={checked} onCheckedChange={setChecked} />
      );
    }
    return <Demo />;
  },
};
