import type { Meta, StoryObj } from '@storybook/react';
import { Label } from './Label';

const meta: Meta<typeof Label> = {
  title: 'Typography/Label',
  component: Label,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => (
    <>
      <Label htmlFor="name">Name</Label>
      <input id="name" style={{ display: 'block', marginTop: 4 }} />
    </>
  ),
};

export const Required: Story = {
  render: () => (
    <>
      <Label htmlFor="name-2" required>
        Name
      </Label>
      <input id="name-2" style={{ display: 'block', marginTop: 4 }} />
    </>
  ),
};
