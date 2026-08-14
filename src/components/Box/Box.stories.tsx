import type { Meta, StoryObj } from '@storybook/react';
import { Box } from './Box';

const meta: Meta<typeof Box> = {
  title: 'Foundations/Box',
  component: Box,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: {
    children: 'Box content',
    p: 'md',
  },
  render: (args) => <Box {...args} style={{ background: 'var(--ds-color-surface-secondary)' }} />,
};

export const PolymorphicAsSection: Story = {
  render: () => (
    <Box as="section" p="lg" style={{ border: '1px dashed var(--ds-color-border-primary)' }}>
      Rendered as a &lt;section&gt;
    </Box>
  ),
};

export const SpacingScale: Story = {
  render: () => (
    <Box style={{ display: 'flex', gap: 'var(--ds-space-sm)' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((token) => (
        <Box key={token} p={token} style={{ background: 'var(--ds-color-surface-secondary)' }}>
          {token}
        </Box>
      ))}
    </Box>
  ),
};
