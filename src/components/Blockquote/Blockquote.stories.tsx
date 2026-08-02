import type { Meta, StoryObj } from '@storybook/react';
import { Blockquote } from './Blockquote';

const meta: Meta<typeof Blockquote> = {
  title: 'Typography/Blockquote',
  component: Blockquote,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Blockquote>;

export const Default: Story = {
  render: () => (
    <Blockquote style={{ maxWidth: 400 }}>
      Design is not just what it looks like and feels like. Design is how it works.
    </Blockquote>
  ),
};
