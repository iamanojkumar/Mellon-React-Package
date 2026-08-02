import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { RangeSlider } from './RangeSlider';
import type { RangeSliderValue } from './RangeSlider';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof RangeSlider> = {
  title: 'Inputs/RangeSlider',
  component: RangeSlider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RangeSlider>;

export const Default: Story = {
  args: {
    defaultValue: [20, 80],
  },
};

export const Stepped: Story = {
  args: {
    defaultValue: [20, 60],
    step: 10,
  },
};

export const PriceRange: Story = {
  args: {
    min: 0,
    max: 500,
    step: 10,
    defaultValue: [50, 300],
    startLabel: 'Minimum price',
    endLabel: 'Maximum price',
    formatValue: (value) => `$${value}`,
  },
};

export const Vertical: Story = {
  args: {
    defaultValue: [30, 70],
    orientation: 'vertical',
  },
};

export const ValueAlwaysVisible: Story = {
  name: 'Values always visible (showValue="always")',
  args: {
    defaultValue: [30, 70],
    showValue: 'always',
  },
};

export const ValueOnDrag: Story = {
  name: 'Values shown while dragging (showValue="drag")',
  args: {
    min: 0,
    max: 500,
    step: 10,
    defaultValue: [50, 300],
    showValue: 'drag',
    formatValue: (value) => `$${value}`,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: [20, 80],
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<RangeSliderValue>([10, 90]);
      return (
        <Stack gap="xs" style={{ width: 240 }}>
          <RangeSlider value={value} onChange={setValue} />
          <Text size="sm" color="secondary">
            Value: [{value[0]}, {value[1]}]
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
