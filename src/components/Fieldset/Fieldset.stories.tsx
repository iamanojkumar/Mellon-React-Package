import type { Meta, StoryObj } from '@storybook/react';
import { Fieldset } from './Fieldset';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';

const meta: Meta<typeof Fieldset> = {
  title: 'Form/Fieldset',
  component: Fieldset,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Fieldset>;

export const Default: Story = {
  render: () => (
    <Fieldset legend="Shipping address" style={{ maxWidth: 320 }}>
      <Field label="Street">
        <Input />
      </Field>
      <Field label="City">
        <Input />
      </Field>
    </Fieldset>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Fieldset legend="Shipping address" disabled style={{ maxWidth: 320 }}>
      <Field label="Street">
        <Input />
      </Field>
    </Fieldset>
  ),
};
