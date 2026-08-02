import type { Meta, StoryObj } from '@storybook/react';
import { FormGroup } from './FormGroup';
import { Label } from '../Label/Label';

const meta: Meta<typeof FormGroup> = {
  title: 'Form/FormGroup',
  component: FormGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormGroup>;

export const Default: Story = {
  render: () => (
    <div>
      <Label>Notify me about</Label>
      <FormGroup gap="xs" style={{ marginTop: 'var(--ds-space-xs)' }}>
        <label>
          <input type="checkbox" /> Comments
        </label>
        <label>
          <input type="checkbox" /> Mentions
        </label>
        <label>
          <input type="checkbox" /> Direct messages
        </label>
      </FormGroup>
    </div>
  ),
};
