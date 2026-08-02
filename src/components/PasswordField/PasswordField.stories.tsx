import type { Meta, StoryObj } from '@storybook/react';
import { PasswordField } from './PasswordField';

const meta: Meta<typeof PasswordField> = {
  title: 'Inputs/PasswordField',
  component: PasswordField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

export const Default: Story = {
  args: {
    'aria-label': 'Password',
    placeholder: 'Enter your password',
  },
};

export const WithValue: Story = {
  args: {
    'aria-label': 'Password',
    defaultValue: 'super-secret',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Password',
    defaultValue: 'weak',
    invalid: true,
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Password',
    defaultValue: 'super-secret',
    disabled: true,
  },
};
