import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from './Spinner';
import type { SpinnerSize } from './Spinner';

const SIZES: SpinnerSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof Spinner> = {
  title: 'Feedback/Spinner',
  component: Spinner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {
  render: () => <Spinner />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-md)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <Spinner key={size} size={size} />
      ))}
    </div>
  ),
};
