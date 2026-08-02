import type { Meta, StoryObj } from '@storybook/react';
import { Paragraph } from './Paragraph';

const meta: Meta<typeof Paragraph> = {
  title: 'Typography/Paragraph',
  component: Paragraph,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Paragraph>;

export const Default: Story = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <Paragraph>
        This library is styled entirely through --ds-* CSS variables, so components never change
        when the underlying design tokens do.
      </Paragraph>
      <Paragraph>Consecutive paragraphs get spacing between them automatically.</Paragraph>
    </div>
  ),
};
