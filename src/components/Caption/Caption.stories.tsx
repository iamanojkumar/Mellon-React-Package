import type { Meta, StoryObj } from '@storybook/react';
import { Caption } from './Caption';

const meta: Meta<typeof Caption> = {
  title: 'Typography/Caption',
  component: Caption,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Caption>;

export const Default: Story = {
  render: () => (
    <figure style={{ margin: 0 }}>
      <div style={{ width: 200, height: 120, background: 'var(--ds-color-surface-secondary)' }} />
      <Caption as="figcaption">A photo of something, taken somewhere.</Caption>
    </figure>
  ),
};
