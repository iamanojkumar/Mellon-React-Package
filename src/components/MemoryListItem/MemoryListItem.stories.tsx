import type { Meta, StoryObj } from '@storybook/react';
import { MemoryListItem } from './MemoryListItem';

const meta: Meta<typeof MemoryListItem> = {
  title: 'AI Chat/MemoryListItem',
  component: MemoryListItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MemoryListItem>;

export const Default: Story = {
  render: () => (
    <ul>
      <MemoryListItem>Prefers dark mode</MemoryListItem>
    </ul>
  ),
};

export const WithForget: Story = {
  render: () => (
    <ul>
      <MemoryListItem onForget={() => alert('Forgotten')}>Prefers dark mode</MemoryListItem>
    </ul>
  ),
};

export const List: Story = {
  render: () => (
    <ul>
      <MemoryListItem onForget={() => {}}>Prefers dark mode</MemoryListItem>
      <MemoryListItem onForget={() => {}}>Works primarily in TypeScript</MemoryListItem>
      <MemoryListItem onForget={() => {}}>Timezone: America/Los_Angeles</MemoryListItem>
    </ul>
  ),
};
