import type { Meta, StoryObj } from '@storybook/react';
import { Code } from './Code';

const meta: Meta<typeof Code> = {
  title: 'Typography/Code',
  component: Code,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Code>;

export const Inline: Story = {
  render: () => (
    <p>
      Run <Code>pnpm install</Code> to install dependencies.
    </p>
  ),
};

export const Block: Story = {
  render: () => (
    <Code as="pre" block>
      {'pnpm generate:component Buttons Button'}
    </Code>
  ),
};
