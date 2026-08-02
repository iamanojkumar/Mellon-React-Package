import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Inline } from './Inline';

const meta: Meta<typeof Inline> = {
  title: 'Foundations/Inline',
  component: Inline,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Inline>;

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: 'var(--ds-radius-full)',
        background: 'var(--ds-color-surface-secondary)',
        fontSize: 'var(--ds-font-size-sm)',
      }}
    >
      {children}
    </span>
  );
}

export const Default: Story = {
  render: () => (
    <Inline gap="sm" style={{ maxWidth: 240 }}>
      {Array.from({ length: 8 }, (_, i) => (
        <Pill key={i}>Tag {i + 1}</Pill>
      ))}
    </Inline>
  ),
};

export const NoWrap: Story = {
  render: () => (
    <Inline gap="sm" wrap={false} style={{ maxWidth: 240, overflow: 'hidden' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <Pill key={i}>Tag {i + 1}</Pill>
      ))}
    </Inline>
  ),
};
