import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { SlashCommandPicker } from './SlashCommandPicker';
import type { FloatingListPickerHandle, SlashCommand } from './SlashCommandPicker';
import { TextArea } from '../TextArea/TextArea';

const meta: Meta<typeof SlashCommandPicker> = {
  title: 'AI Chat/SlashCommandPicker',
  component: SlashCommandPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SlashCommandPicker>;

const COMMANDS: SlashCommand[] = [
  { id: '1', label: '/summarize', description: 'Summarize the conversation so far', icon: '↦' },
  { id: '2', label: '/translate', description: 'Translate the last message', icon: '↦' },
  { id: '3', label: '/explain', description: 'Explain the last code block', icon: '↦' },
];

export const Default: Story = {
  args: {
    open: true,
    anchorPoint: { x: 40, y: 80 },
    commands: COMMANDS,
    onSelect: () => {},
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    open: true,
    anchorPoint: { x: 40, y: 80 },
    commands: [],
    onSelect: () => {},
    onClose: () => {},
  },
};

/**
 * A realistic composer integration: typing "/" opens the picker anchored
 * near the textarea, and arrow keys/Enter/Escape are delegated from the
 * textarea's own `onKeyDown` to the picker's exposed `handleKeyDown`.
 */
export const InAComposer: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      const handleRef = useRef<FloatingListPickerHandle>(null);

      return (
        <div style={{ position: 'relative', maxWidth: 320 }}>
          <TextArea
            aria-label="Message"
            placeholder="Type / for a command…"
            onChange={(event) => setOpen(event.target.value.trim().endsWith('/'))}
            onKeyDown={(event) => {
              const handled = handleRef.current?.handleKeyDown(event);
              if (handled) event.preventDefault();
            }}
          />
          <SlashCommandPicker
            ref={handleRef}
            open={open}
            anchorPoint={{ x: 16, y: 60 }}
            commands={COMMANDS}
            onSelect={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </div>
      );
    }
    return <Demo />;
  },
};
