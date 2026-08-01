import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Grid } from './Grid';
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

const meta: Meta<typeof Grid> = {
  title: 'Foundations/Grid',
  component: Grid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Grid>;

export const Default: Story = {
  render: () => (
    <Grid columns={3} gap="sm">
      {Array.from({ length: 6 }, (_, index) => (
        <Swatch key={index}>{index + 1}</Swatch>
      ))}
    </Grid>
  ),
};

export const CustomTemplate: Story = {
  render: () => (
    <Grid columns="1fr 2fr 1fr" gap="sm">
      <Swatch>Sidebar</Swatch>
      <Swatch>Main content</Swatch>
      <Swatch>Aside</Swatch>
    </Grid>
  ),
};

export const RowsAndColumns: Story = {
  render: () => (
    <Grid columns={2} rows={2} gap="sm" style={{ height: 200 }}>
      <Swatch>1</Swatch>
      <Swatch>2</Swatch>
      <Swatch>3</Swatch>
      <Swatch>4</Swatch>
    </Grid>
  ),
};
