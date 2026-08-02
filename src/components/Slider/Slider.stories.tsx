import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Slider } from './Slider';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof Slider> = {
  title: 'Inputs/Slider',
  component: Slider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    'aria-label': 'Volume',
    defaultValue: 40,
  },
};

export const Stepped: Story = {
  args: {
    'aria-label': 'Volume',
    defaultValue: 20,
    step: 10,
  },
};

export const CustomRange: Story = {
  args: {
    'aria-label': 'Temperature',
    min: 60,
    max: 80,
    defaultValue: 70,
    formatValue: (value) => `${value}°F`,
  },
};

export const Vertical: Story = {
  args: {
    'aria-label': 'Volume',
    defaultValue: 60,
    orientation: 'vertical',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="lg" style={{ width: 240 }}>
      <Slider aria-label="Small" size="sm" defaultValue={30} />
      <Slider aria-label="Medium" size="md" defaultValue={50} />
      <Slider aria-label="Large" size="lg" defaultValue={70} />
    </Stack>
  ),
};

export const ValueAlwaysVisible: Story = {
  name: 'Value always visible (showValue="always")',
  args: {
    'aria-label': 'Volume',
    defaultValue: 65,
    showValue: 'always',
  },
};

export const ValueOnDrag: Story = {
  name: 'Value shown while dragging (showValue="drag")',
  args: {
    'aria-label': 'Volume',
    defaultValue: 45,
    showValue: 'drag',
    formatValue: (value) => `${value}%`,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Volume',
    defaultValue: 40,
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState(25);
      return (
        <Stack gap="xs" style={{ width: 240 }}>
          <Slider aria-label="Volume" value={value} onChange={setValue} />
          <Text size="sm" color="secondary">
            Value: {value}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
