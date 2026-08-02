import type { Meta, StoryObj } from '@storybook/react';
import { NumberField } from './NumberField';

const meta: Meta<typeof NumberField> = {
  title: 'Inputs/NumberField',
  component: NumberField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NumberField>;

export const Default: Story = {
  args: {
    'aria-label': 'Quantity',
    placeholder: '0',
  },
};

export const MinMaxStep: Story = {
  args: {
    'aria-label': 'Quantity',
    min: 0,
    max: 10,
    step: 2,
    defaultValue: '0',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Quantity',
    defaultValue: '5',
    disabled: true,
  },
};
