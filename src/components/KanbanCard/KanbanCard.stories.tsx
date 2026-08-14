import type { Meta, StoryObj } from '@storybook/react';
import { KanbanCard } from './KanbanCard';

const meta: Meta<typeof KanbanCard> = {
  title: 'Board/KanbanCard',
  component: KanbanCard,
  decorators: [
    (Story) => (
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: '18rem' }}>
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanCard>;

export const Default: Story = {
  args: { card: { id: 'c1', title: 'Audit chart tokens' } },
};

export const Detailed: Story = {
  args: {
    card: {
      id: 'c2',
      title: 'Fix login redirect',
      description: 'Users bounce back to /login after SSO.',
      status: 'danger',
      tags: ['bug', 'auth'],
      assignee: { id: 'u1', name: 'Ana Diaz' },
    },
  },
};

/** Each status renders its word visibly — the hue is reinforcement, never the sole carrier. */
export const Statuses: Story = {
  render: () => (
    <>
      <KanbanCard card={{ id: 's1', title: 'On track item', status: 'success' }} />
      <KanbanCard card={{ id: 's2', title: 'At risk item', status: 'warning' }} />
      <KanbanCard card={{ id: 's3', title: 'Blocked item', status: 'danger' }} />
    </>
  ),
};

/** Actions sit outside the flow, so they survive a custom `renderCard` face too. */
export const WithActions: Story = {
  args: {
    card: { id: 'c5', title: 'Card with actions', tags: ['design'] },
    actions: (
      <button type="button" aria-label="Actions for Card with actions">
        ⋯
      </button>
    ),
  },
};

export const Dragging: Story = {
  args: { card: { id: 'c3', title: 'Mid-drag card' }, dragging: true },
};

/** A keyboard lift has no pointer following it, so it keeps a persistent ring instead of ghosting. */
export const Lifted: Story = {
  args: { card: { id: 'c4', title: 'Picked up by keyboard' }, lifted: true },
};
