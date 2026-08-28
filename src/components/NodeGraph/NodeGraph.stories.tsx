import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { NodeGraph } from './NodeGraph';
import type { NodeGraphData } from '../../utilities/nodeGraph';

const meta: Meta<typeof NodeGraph> = {
  title: 'Node/NodeGraph',
  component: NodeGraph,
  decorators: [
    (Story) => (
      <div style={{ width: '48rem', height: '24rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NodeGraph>;

const starterGraph: NodeGraphData = {
  nodes: [
    {
      id: 'brief',
      name: 'Brief',
      data: { text: 'Write launch copy for the new export flow.' },
      x: 40,
      y: 40,
    },
    {
      id: 'draft',
      name: 'Draft',
      data: { text: 'Draft pending — connect Brief to fill this in.' },
      x: 360,
      y: 40,
    },
    { id: 'review', name: 'Review', data: { text: 'Awaiting a draft to review.' }, x: 680, y: 40 },
  ],
  connections: [{ id: 'c1', source: 'brief', target: 'draft' }],
  groups: [],
};

/** Click a node's output port to arm it, then a target's input port to connect — or drag a node by its header to reposition it. Select 2+ nodes (shift-click) and press "G" to group them. */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState(starterGraph);
      return (
        <NodeGraph
          value={value}
          onChange={setValue}
          renderNode={(node) => (node.data as { text: string }).text}
        />
      );
    }
    return <Demo />;
  },
};

const groupedGraph: NodeGraphData = {
  nodes: [
    { id: 'a', name: 'Fetch', data: 'GET /orders', x: 40, y: 60 },
    { id: 'b', name: 'Transform', data: 'normalize()', x: 320, y: 60 },
    { id: 'c', name: 'Publish', data: 'emit()', x: 600, y: 60 },
  ],
  connections: [
    { id: 'c1', source: 'a', target: 'b' },
    { id: 'c2', source: 'b', target: 'c' },
  ],
  groups: [{ id: 'g1', name: 'Pipeline', nodeIds: ['a', 'b'] }],
};

export const Grouped: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState(groupedGraph);
      return <NodeGraph value={value} onChange={setValue} />;
    }
    return <Demo />;
  },
};

export const ReadOnly: Story = {
  args: { value: groupedGraph, readOnly: true },
};
