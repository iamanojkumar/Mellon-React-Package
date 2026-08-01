import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Flex } from './Flex';
import { Box } from '../Box/Box';

function Swatch({ children }: { children: ReactNode }) {
  return (
    <Box
      p="sm"
      style={{
        background: 'var(--ds-color-surface-secondary)',
        border: '1px solid var(--ds-color-border-primary)',
      }}
    >
      {children}
    </Box>
  );
}

const meta: Meta<typeof Flex> = {
  title: 'Foundations/Flex',
  component: Flex,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Flex>;

export const Default: Story = {
  render: () => (
    <Flex gap="sm">
      <Swatch>One</Swatch>
      <Swatch>Two</Swatch>
      <Swatch>Three</Swatch>
    </Flex>
  ),
};

export const Direction: Story = {
  render: () => (
    <Flex direction="column" gap="sm">
      <Swatch>One</Swatch>
      <Swatch>Two</Swatch>
      <Swatch>Three</Swatch>
    </Flex>
  ),
};

export const AlignAndJustify: Story = {
  render: () => (
    <Flex
      align="center"
      justify="between"
      gap="sm"
      style={{ height: 120, background: 'var(--ds-color-surface-secondary)' }}
    >
      <Swatch>Start</Swatch>
      <Swatch>Middle</Swatch>
      <Swatch>End</Swatch>
    </Flex>
  ),
};

export const Wrap: Story = {
  render: () => (
    <Flex wrap="wrap" gap="sm" style={{ maxWidth: 200 }}>
      {Array.from({ length: 8 }, (_, index) => (
        <Swatch key={index}>{index + 1}</Swatch>
      ))}
    </Flex>
  ),
};
