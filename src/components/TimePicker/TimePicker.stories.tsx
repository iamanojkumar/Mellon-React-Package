import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TimePicker } from './TimePicker';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof TimePicker> = {
  title: 'Inputs/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TimePicker>;

export const Default: Story = {
  args: {
    'aria-label': 'Time',
  },
};

export const FifteenMinuteStep: Story = {
  args: {
    'aria-label': 'Time',
    step: 15,
    min: '09:00',
    max: '17:00',
  },
};

export const TwentyFourHour: Story = {
  name: '24-hour labels',
  args: {
    'aria-label': 'Time',
    use12Hour: false,
  },
};

export const Preselected: Story = {
  args: {
    'aria-label': 'Time',
    defaultValue: '14:30',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Time',
    defaultValue: '09:00',
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 240 }}>
          <TimePicker aria-label="Time" value={value} onChange={setValue} step={15} />
          <Text size="sm" color="secondary">
            Value (24h): {value || '(none)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
