import type { Meta, StoryObj } from '@storybook/react';
import { ListItem } from './ListItem';
import { List } from '../List/List';

const meta: Meta<typeof ListItem> = {
  title: 'Typography/ListItem',
  component: ListItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  render: () => (
    <List>
      <ListItem>An item styled to match Text</ListItem>
      <ListItem color="secondary">A muted item</ListItem>
    </List>
  ),
};
