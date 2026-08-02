import type { Meta, StoryObj } from '@storybook/react';
import { IconButton } from './IconButton';
import type { ButtonSize } from '../Button/Button';

const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof IconButton> = {
  title: 'Buttons/IconButton',
  component: IconButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  render: () => (
    <IconButton aria-label="Close">
      <span aria-hidden="true">×</span>
    </IconButton>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <IconButton key={size} aria-label="Close" size={size}>
          <span aria-hidden="true">×</span>
        </IconButton>
      ))}
    </div>
  ),
};

export const Circle: Story = {
  render: () => (
    <IconButton aria-label="Close" shape="circle" variant="primary">
      <span aria-hidden="true">×</span>
    </IconButton>
  ),
};

export const Loading: Story = {
  render: () => (
    <IconButton aria-label="Saving" loading>
      <span aria-hidden="true">✓</span>
    </IconButton>
  ),
};
