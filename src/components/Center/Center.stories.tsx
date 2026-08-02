import type { Meta, StoryObj } from '@storybook/react';
import { Center } from './Center';

const meta: Meta<typeof Center> = {
  title: 'Foundations/Center',
  component: Center,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Center>;

export const Default: Story = {
  render: () => (
    <Center
      style={{ width: 240, height: 160, border: '1px dashed var(--ds-color-border-primary)' }}
    >
      Centered content
    </Center>
  ),
};

export const Inline: Story = {
  render: () => (
    <p>
      Some text with an{' '}
      <Center
        inline
        style={{ width: 32, height: 32, background: 'var(--ds-color-surface-secondary)' }}
      >
        ●
      </Center>{' '}
      icon centered inline.
    </p>
  ),
};
