import type { Meta, StoryObj } from '@storybook/react';
import { FormSection } from './FormSection';
import { Field } from '../Field/Field';
import { Input } from '../Input/Input';

const meta: Meta<typeof FormSection> = {
  title: 'Form/FormSection',
  component: FormSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormSection>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <FormSection title="Personal information" description="How we can reach you.">
        <Field label="Name">
          <Input />
        </Field>
        <Field label="Email">
          <Input />
        </Field>
      </FormSection>
      <FormSection title="Notifications">
        <Field label="Frequency">
          <Input />
        </Field>
      </FormSection>
    </div>
  ),
};
