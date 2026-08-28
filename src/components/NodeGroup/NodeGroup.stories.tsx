import type { Meta, StoryObj } from '@storybook/react';
import { NodeGroup } from './NodeGroup';

const meta: Meta<typeof NodeGroup> = {
  title: 'Node/NodeGroup',
  component: NodeGroup,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: '20rem', height: '8rem', padding: '2rem 0' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NodeGroup>;

/** Position and size come from a parent `NodeGraph`, derived from its members' current positions. */
export const Default: Story = {
  args: { name: 'Research', style: { left: 0, top: '2rem', width: '16rem', height: '4rem' } },
};

export const RenamableWithUngroup: Story = {
  args: {
    ...Default.args,
    onRename: () => {},
    onUngroup: () => {},
  },
};
