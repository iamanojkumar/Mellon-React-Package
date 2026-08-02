import type { Meta, StoryObj } from '@storybook/react';
import { RadioGroup } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'Inputs/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <RadioGroup.Radio value="compact">Compact</RadioGroup.Radio>
      <RadioGroup.Radio value="comfortable">Comfortable</RadioGroup.Radio>
      <RadioGroup.Radio value="spacious">Spacious</RadioGroup.Radio>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup defaultValue="md" orientation="horizontal">
      <RadioGroup.Radio value="sm">Small</RadioGroup.Radio>
      <RadioGroup.Radio value="md">Medium</RadioGroup.Radio>
      <RadioGroup.Radio value="lg">Large</RadioGroup.Radio>
    </RadioGroup>
  ),
};

/** Arrow keys move focus and select at the same time ("automatic activation") — the standard radio-group keyboard model. */
export const KeyboardNavigation: Story = {
  render: () => (
    <RadioGroup defaultValue="one">
      <RadioGroup.Radio value="one">First</RadioGroup.Radio>
      <RadioGroup.Radio value="two">Second</RadioGroup.Radio>
      <RadioGroup.Radio value="three" disabled>
        Third (disabled)
      </RadioGroup.Radio>
      <RadioGroup.Radio value="four">Fourth</RadioGroup.Radio>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="one" disabled>
      <RadioGroup.Radio value="one">First</RadioGroup.Radio>
      <RadioGroup.Radio value="two">Second</RadioGroup.Radio>
    </RadioGroup>
  ),
};
