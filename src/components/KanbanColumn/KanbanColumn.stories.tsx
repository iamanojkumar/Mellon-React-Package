import type { Meta, StoryObj } from '@storybook/react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from '../KanbanCard/KanbanCard';

const meta: Meta<typeof KanbanColumn> = {
  title: 'Board/KanbanColumn',
  component: KanbanColumn,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '18rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanColumn>;

const cards = (
  <>
    <KanbanCard card={{ id: 'c1', title: 'Audit chart tokens' }} />
    <KanbanCard card={{ id: 'c2', title: 'Fix login redirect', status: 'danger' }} />
  </>
);

export const Default: Story = {
  args: { column: { id: 'todo', title: 'To do', cardIds: ['c1', 'c2'] }, children: cards },
};

export const Empty: Story = {
  args: { column: { id: 'done', title: 'Done', cardIds: [] } },
};

/** With a limit set, the header reads "n of limit" instead of a bare count. */
export const WithWipLimit: Story = {
  args: {
    column: { id: 'doing', title: 'In progress', cardIds: ['c1', 'c2'], wipLimit: 3 },
    children: cards,
  },
};

/** Over the limit: stated in words, with the border as reinforcement only. */
export const OverWipLimit: Story = {
  args: {
    column: { id: 'doing', title: 'In progress', cardIds: ['c1', 'c2'], wipLimit: 1 },
    children: cards,
  },
};

/** `active` is set by the board while a dragged card hovers this column. */
export const ActiveDropTarget: Story = {
  args: {
    column: { id: 'todo', title: 'To do', cardIds: ['c1', 'c2'] },
    children: cards,
    active: true,
  },
};
