import type { Meta, StoryObj } from '@storybook/react';
import { TextArea } from './TextArea';

const meta: Meta<typeof TextArea> = {
  title: 'Inputs/TextArea',
  component: TextArea,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    'aria-label': 'Bio',
    placeholder: 'Tell us about yourself…',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Bio',
    defaultValue: 'Too short',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Bio',
    defaultValue: 'Can’t edit this',
    disabled: true,
  },
};

export const Rows: Story = {
  args: {
    'aria-label': 'Bio',
    rows: 8,
    placeholder: 'A taller textarea…',
  },
};
