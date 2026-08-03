import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MemoryEditor } from './MemoryEditor';
import type { Memory } from './MemoryEditor';

const meta: Meta<typeof MemoryEditor> = {
  title: 'AI Chat/MemoryEditor',
  component: MemoryEditor,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MemoryEditor>;

const INITIAL_MEMORIES: Memory[] = [
  { id: '1', text: 'Prefers dark mode' },
  { id: '2', text: 'Works primarily in TypeScript' },
  { id: '3', text: 'Timezone: America/Los_Angeles' },
];

export const Default: Story = {
  args: {
    memories: INITIAL_MEMORIES,
    onForget: () => {},
    onAdd: () => {},
  },
};

export const Empty: Story = {
  args: {
    memories: [],
    onForget: () => {},
    onAdd: () => {},
  },
};

export const Interactive: Story = {
  render: () => {
    function Demo() {
      const [memories, setMemories] = useState<Memory[]>(INITIAL_MEMORIES);
      return (
        <MemoryEditor
          memories={memories}
          onAdd={(text) => setMemories((prev) => [...prev, { id: crypto.randomUUID(), text }])}
          onForget={(id) => setMemories((prev) => prev.filter((memory) => memory.id !== id))}
        />
      );
    }
    return <Demo />;
  },
};
