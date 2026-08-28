import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Node } from './Node';

const meta: Meta<typeof Node> = {
  title: 'Node/Node',
  component: Node,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '20rem', height: '8rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Node>;

export const Default: Story = {
  args: { id: 'n1', name: 'Prompt', style: { left: 0, top: 0, width: 220, height: 110 } },
  render: (args) => (
    <Node {...args}>
      <p>Write a haiku about the ocean.</p>
    </Node>
  ),
};

export const Selected: Story = {
  args: { ...Default.args, selected: true },
  render: Default.render,
};

/** A source node with nothing feeding it has no input port. */
export const NoInput: Story = {
  args: {
    id: 'n1',
    name: 'Source',
    hasInput: false,
    style: { left: 0, top: 0, width: 220, height: 110 },
  },
  render: (args) => (
    <Node {...args}>
      <p>Fixed constant.</p>
    </Node>
  ),
};

/** Double-clicking the name swaps it for an input when `onRename` is supplied. */
export const Renamable: Story = {
  render: () => {
    function Demo() {
      const [name, setName] = useState('Prompt');
      return (
        <Node
          id="n1"
          name={name}
          onRename={setName}
          style={{ left: 0, top: 0, width: 220, height: 110 }}
        >
          <p>Double-click the name to rename it.</p>
        </Node>
      );
    }
    return <Demo />;
  },
};
