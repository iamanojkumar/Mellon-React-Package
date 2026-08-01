import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Stack } from './Stack';
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

const meta: Meta<typeof Stack> = {
  title: 'Foundations/Stack',
  component: Stack,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Stack>;

export const Default: Story = {
  render: () => (
    <Stack gap="sm">
      <Swatch>One</Swatch>
      <Swatch>Two</Swatch>
      <Swatch>Three</Swatch>
    </Stack>
  ),
};

export const GapScale: Story = {
  render: () => (
    <Stack gap="lg">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((gap) => (
        <Stack key={gap} gap={gap} style={{ flexDirection: 'row' }}>
          <Swatch>{gap}</Swatch>
          <Swatch>{gap}</Swatch>
        </Stack>
      ))}
    </Stack>
  ),
};

export const CenteredAlignment: Story = {
  render: () => (
    <Stack gap="sm" align="center">
      <Swatch>Narrow</Swatch>
      <Box p="sm" style={{ width: 200, background: 'var(--ds-color-surface-secondary)' }}>
        Wide
      </Box>
    </Stack>
  ),
};
