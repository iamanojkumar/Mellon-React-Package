import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { MentionPicker } from './MentionPicker';
import type { FloatingListPickerHandle, MentionOption } from './MentionPicker';
import { Avatar } from '../Avatar/Avatar';
import { TextArea } from '../TextArea/TextArea';

const meta: Meta<typeof MentionPicker> = {
  title: 'AI Chat/MentionPicker',
  component: MentionPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MentionPicker>;

const OPTIONS: MentionOption[] = [
  {
    id: '1',
    name: 'Alex Chen',
    avatar: <Avatar name="Alex Chen" size="xs" />,
    description: 'Design',
  },
  {
    id: '2',
    name: 'Jordan Lee',
    avatar: <Avatar name="Jordan Lee" size="xs" />,
    description: 'Engineering',
  },
  {
    id: '3',
    name: 'Sam Rivera',
    avatar: <Avatar name="Sam Rivera" size="xs" />,
    description: 'Product',
  },
];

export const Default: Story = {
  args: {
    open: true,
    anchorPoint: { x: 40, y: 80 },
    options: OPTIONS,
    onSelect: () => {},
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    open: true,
    anchorPoint: { x: 40, y: 80 },
    options: [],
    emptyLabel: 'No people found',
    onSelect: () => {},
    onClose: () => {},
  },
};

/**
 * A realistic composer integration: typing "@" opens the picker anchored
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
            placeholder="Type @ to mention someone…"
            onChange={(event) => setOpen(event.target.value.trim().endsWith('@'))}
            onKeyDown={(event) => {
              const handled = handleRef.current?.handleKeyDown(event);
              if (handled) event.preventDefault();
            }}
          />
          <MentionPicker
            ref={handleRef}
            open={open}
            anchorPoint={{ x: 16, y: 60 }}
            options={OPTIONS}
            onSelect={() => setOpen(false)}
            onClose={() => setOpen(false)}
          />
        </div>
      );
    }
    return <Demo />;
  },
};
