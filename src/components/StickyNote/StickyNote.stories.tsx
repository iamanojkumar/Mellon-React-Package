import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StickyNote } from './StickyNote';

const meta: Meta<typeof StickyNote> = {
  title: 'Canvas/StickyNote',
  component: StickyNote,
  decorators: [
    (Story) => (
      <div style={{ width: '12rem', height: '10rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof StickyNote>;

export const Default: Story = { args: { text: 'Ship the release notes' } };

/** Tone is decoration only — the note's own text is what carries its meaning. */
export const Tones: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)' }}>
      {(['neutral', 'brand', 'success', 'warning', 'danger'] as const).map((tone) => (
        <div key={tone} style={{ width: '10rem', height: '8rem' }}>
          <StickyNote tone={tone} text={`${tone} note`} />
        </div>
      ))}
    </div>
  ),
};

export const LongText: Story = {
  args: {
    text: 'A much longer note that has to wrap inside its own bounds rather than spilling over the edge of the card.',
  },
};

/** Enter makes new lines; Escape or Ctrl/Cmd+Enter finishes. */
export const Editing: Story = {
  render: function EditableNote() {
    const [text, setText] = useState('Click in and type');
    const [editing, setEditing] = useState(true);
    return (
      <StickyNote
        text={text}
        editing={editing}
        onTextChange={setText}
        onEditingEnd={() => setEditing(false)}
      />
    );
  },
};
