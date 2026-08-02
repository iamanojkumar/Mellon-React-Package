import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Chip } from './Chip';

const meta: Meta<typeof Chip> = {
  title: 'Data Display/Chip',
  component: Chip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Chip>;

export const Static: Story = {
  render: () => <Chip>Read-only</Chip>,
};

export const Removable: Story = {
  render: () => {
    function Demo() {
      const [chips, setChips] = useState(['React', 'TypeScript', 'Vite']);
      return (
        <div style={{ display: 'flex', gap: 'var(--ds-space-xs)' }}>
          {chips.map((chip) => (
            <Chip
              key={chip}
              removeLabel={`Remove ${chip}`}
              onRemove={() => setChips((prev) => prev.filter((c) => c !== chip))}
            >
              {chip}
            </Chip>
          ))}
        </div>
      );
    }
    return <Demo />;
  },
};

export const Disabled: Story = {
  render: () => (
    <Chip onRemove={() => {}} disabled>
      Locked
    </Chip>
  ),
};
