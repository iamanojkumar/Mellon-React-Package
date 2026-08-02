import type { Meta, StoryObj } from '@storybook/react';
import { List } from './List';
import { ListItem } from '../ListItem/ListItem';

const meta: Meta<typeof List> = {
  title: 'Typography/List',
  component: List,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof List>;

export const Unordered: Story = {
  render: () => (
    <List>
      <ListItem>First item</ListItem>
      <ListItem>Second item</ListItem>
      <ListItem>Third item</ListItem>
    </List>
  ),
};

export const Ordered: Story = {
  render: () => (
    <List ordered>
      <ListItem>First step</ListItem>
      <ListItem>Second step</ListItem>
      <ListItem>Third step</ListItem>
    </List>
  ),
};

export const Unstyled: Story = {
  render: () => (
    <List unstyled spacing="sm">
      <ListItem>No bullet</ListItem>
      <ListItem>No bullet</ListItem>
    </List>
  ),
};
