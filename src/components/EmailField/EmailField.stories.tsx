import type { Meta, StoryObj } from '@storybook/react';
import { EmailField } from './EmailField';

const meta: Meta<typeof EmailField> = {
  title: 'Inputs/EmailField',
  component: EmailField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmailField>;

export const Default: Story = {
  args: {
    'aria-label': 'Email',
    placeholder: 'you@example.com',
  },
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
    'aria-label': 'Email',
    defaultValue: 'you@example.com',
    disabled: true,
  },
};
