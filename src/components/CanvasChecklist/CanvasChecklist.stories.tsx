import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CanvasChecklist } from './CanvasChecklist';
import type { CanvasChecklistItem } from '../../utilities/canvasReducer';

const meta: Meta<typeof CanvasChecklist> = {
  title: 'Canvas/CanvasChecklist',
  component: CanvasChecklist,
  decorators: [
    (Story) => (
      <div style={{ width: '16rem', height: '14rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CanvasChecklist>;

const items: CanvasChecklistItem[] = [
  { id: '1', text: 'Draft the brief', done: true },
  { id: '2', text: 'Book the room' },
  { id: '3', text: 'Send invites' },
];

/** Controlled, like every block face — the canvas owns the state. */
export const Default: Story = {
  render: function ControlledChecklist() {
    const [list, setList] = useState(items);
    return (
      <CanvasChecklist
        title="Launch"
        items={list}
        onItemToggle={(id, done) =>
          setList((current) => current.map((item) => (item.id === id ? { ...item, done } : item)))
        }
      />
    );
  },
};

/** Without `onItemToggle` the boxes are disabled rather than inert-but-clickable. */
export const ReadOnly: Story = {
  args: { items, title: 'Launch' },
};
