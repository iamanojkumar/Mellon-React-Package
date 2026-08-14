import type { Meta, StoryObj } from '@storybook/react';
import { KanbanChangePreview } from './KanbanChangePreview';
import type { KanbanBoardData } from '../../utilities/kanbanReducer';

const board: KanbanBoardData = {
  columns: [
    { id: 'backlog', title: 'Backlog', cardIds: ['c1', 'c2'] },
    { id: 'done', title: 'Done', cardIds: [] },
  ],
  cards: {
    c1: { id: 'c1', title: 'Audit chart tokens' },
    c2: { id: 'c2', title: 'Fix login redirect' },
  },
};

const meta: Meta<typeof KanbanChangePreview> = {
  title: 'Board/KanbanChangePreview',
  component: KanbanChangePreview,
  args: { board, onAccept: () => {}, onReject: () => {} },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '32rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof KanbanChangePreview>;

/** Everything starts checked: the user is confirming a proposal, not assembling one. */
export const Default: Story = {
  args: {
    commands: [
      { op: 'move', cardId: 'c1', toColumnId: 'done' },
      { op: 'move', cardId: 'c2', toColumnId: 'done' },
    ],
  },
};

/** A delete is always staged, never auto-applied — however small the batch. */
export const WithDelete: Story = {
  args: {
    commands: [
      { op: 'update', cardId: 'c1', patch: { status: 'danger' } },
      { op: 'delete', cardId: 'c2' },
    ],
    message: 'Two cards looked like duplicates, so I flagged one and removed the other.',
  },
};

/** Commands that failed validation are listed with their reason rather than vanishing. */
export const WithRejectedCommands: Story = {
  args: {
    commands: [{ op: 'move', cardId: 'c1', toColumnId: 'done' }],
    rejected: [
      { command: { op: 'delete', cardId: 'ghost' }, reason: 'Unknown card "ghost"' },
      {
        command: { op: 'move', cardId: 'c2', toColumnId: 'nowhere' },
        reason: 'Unknown column "nowhere"',
      },
    ],
  },
};

/** Everything the model proposed was invalid — the reasons are the whole content. */
export const AllRejected: Story = {
  args: {
    commands: [],
    rejected: [{ command: { op: 'delete', cardId: 'ghost' }, reason: 'Unknown card "ghost"' }],
  },
};
