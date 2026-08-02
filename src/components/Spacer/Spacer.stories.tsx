import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './Spacer';
import { Flex } from '../Flex/Flex';
import { Button } from '../Button/Button';

const meta: Meta<typeof Spacer> = {
  title: 'Foundations/Spacer',
  component: Spacer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Spacer>;

export const PushesSiblingsApart: Story = {
  render: () => (
    <Flex style={{ width: 320, border: '1px dashed var(--ds-color-border-primary)' }}>
      <Button variant="secondary">Cancel</Button>
      <Spacer />
      <Button>Save</Button>
    </Flex>
  ),
};

export const FixedSize: Story = {
  render: () => (
    <Flex align="center">
      <Button variant="secondary">A</Button>
      <Spacer size="lg" />
      <Button variant="secondary">B</Button>
    </Flex>
  ),
};
