import type { Meta, StoryObj } from '@storybook/react';
import { StatusLine } from './StatusLine';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof StatusLine> = {
  title: 'AI Chat/StatusLine',
  component: StatusLine,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusLine>;

export const Default: Story = {
  args: {
    children: 'Searching the web…',
  },
};

export const Sequence: Story = {
  render: () => (
    <Stack gap="xs">
      <StatusLine>Searching the web…</StatusLine>
      <StatusLine>Reading 3 pages…</StatusLine>
      <StatusLine>Drafting a response…</StatusLine>
    </Stack>
  ),
};

export const CustomIcon: Story = {
  args: {
    icon: '🔍',
    children: 'Searching the web…',
  },
};
