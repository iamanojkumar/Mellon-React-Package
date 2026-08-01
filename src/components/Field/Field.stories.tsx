import type { Meta, StoryObj } from '@storybook/react';
import { Field } from './Field';
import { Input } from '../Input/Input';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Field> = {
  title: 'Form/Field',
  component: Field,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Field>;

export const Default: Story = {
  render: () => (
    <Field label="Email" style={{ maxWidth: 280 }}>
      <Input placeholder="you@example.com" />
    </Field>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <Field
      label="Email"
      helperText="We'll only use this to send receipts."
      style={{ maxWidth: 280 }}
    >
      <Input placeholder="you@example.com" />
    </Field>
  ),
};

export const Required: Story = {
  render: () => (
    <Field label="Email" required style={{ maxWidth: 280 }}>
      <Input placeholder="you@example.com" />
    </Field>
  ),
};

export const WithError: Story = {
  render: () => (
    <Field
      label="Email"
      helperText="We'll only use this to send receipts."
      errorMessage="Enter a valid email address."
      style={{ maxWidth: 280 }}
    >
      <Input defaultValue="not-an-email" />
    </Field>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Field
      label="Email"
      disabled
      helperText="This field can't be edited."
      style={{ maxWidth: 280 }}
    >
      <Input defaultValue="you@example.com" />
    </Field>
  ),
};

export const MultipleFields: Story = {
  render: () => (
    <Stack gap="md" style={{ maxWidth: 280 }}>
      <Field label="Name" required>
        <Input placeholder="Ada Lovelace" />
      </Field>
      <Field label="Email" helperText="We'll only use this to send receipts.">
        <Input placeholder="you@example.com" />
      </Field>
    </Stack>
  ),
};
