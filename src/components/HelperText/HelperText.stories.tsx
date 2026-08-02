import type { Meta, StoryObj } from '@storybook/react';
import { HelperText } from './HelperText';

const meta: Meta<typeof HelperText> = {
  title: 'Form/HelperText',
  component: HelperText,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HelperText>;

export const Default: Story = {
  render: () => <HelperText>We&apos;ll only use this to send receipts.</HelperText>,
};

export const CustomElement: Story = {
  render: () => <HelperText as="span">Rendered as a span instead of the default div.</HelperText>,
};
