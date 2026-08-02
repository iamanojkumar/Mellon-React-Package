import type { Meta, StoryObj } from '@storybook/react';
import { Display } from './Display';
import type { DisplaySize } from './Display';
import { Stack } from '../Stack/Stack';

const SIZES: DisplaySize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof Display> = {
  title: 'Typography/Display',
  component: Display,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Display>;

export const Default: Story = {
  render: () => <Display>Build something great</Display>,
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="sm">
      {SIZES.map((size) => (
        <Display key={size} size={size}>
          Display {size}
        </Display>
      ))}
    </Stack>
  ),
};
