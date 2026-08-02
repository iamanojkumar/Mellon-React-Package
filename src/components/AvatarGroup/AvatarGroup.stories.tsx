import type { Meta, StoryObj } from '@storybook/react';
import { AvatarGroup } from './AvatarGroup';
import { Avatar } from '../Avatar/Avatar';

const meta: Meta<typeof AvatarGroup> = {
  title: 'Data Display/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" />
      <Avatar name="Margaret Hamilton" />
    </AvatarGroup>
  ),
};

export const WithOverflow: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="Ada Lovelace" />
      <Avatar name="Grace Hopper" />
      <Avatar name="Margaret Hamilton" />
      <Avatar name="Katherine Johnson" />
      <Avatar name="Radia Perlman" />
    </AvatarGroup>
  ),
};
