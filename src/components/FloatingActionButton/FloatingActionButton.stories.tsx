import type { Meta, StoryObj } from '@storybook/react';
import { FloatingActionButton } from './FloatingActionButton';

const meta: Meta<typeof FloatingActionButton> = {
  title: 'Buttons/FloatingActionButton',
  component: FloatingActionButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FloatingActionButton>;

export const Default: Story = {
  render: () => (
    <FloatingActionButton aria-label="Add item">
      <span aria-hidden="true">+</span>
    </FloatingActionButton>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)', alignItems: 'center' }}>
      <FloatingActionButton aria-label="Add item" size="md">
        <span aria-hidden="true">+</span>
      </FloatingActionButton>
      <FloatingActionButton aria-label="Add item" size="lg">
        <span aria-hidden="true">+</span>
      </FloatingActionButton>
    </div>
  ),
};

/** `fixed` pins it to the bottom-right of the viewport — scroll the canvas to see it stay in place. */
export const Fixed: Story = {
  render: () => (
    <div style={{ height: 300 }}>
      <p>Scroll or resize to see the button stay pinned to the corner.</p>
      <FloatingActionButton aria-label="Add item" fixed>
        <span aria-hidden="true">+</span>
      </FloatingActionButton>
    </div>
  ),
};
