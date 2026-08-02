import type { Meta, StoryObj } from '@storybook/react';
import { ErrorMessage } from './ErrorMessage';

const meta: Meta<typeof ErrorMessage> = {
  title: 'Form/ErrorMessage',
  component: ErrorMessage,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorMessage>;

export const Default: Story = {
  render: () => <ErrorMessage>Enter a valid email address.</ErrorMessage>,
};

export const CustomElement: Story = {
  render: () => (
    <ErrorMessage as="span">Rendered as a span instead of the default div.</ErrorMessage>
  ),
};
