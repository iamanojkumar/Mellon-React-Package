import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CommandPalette } from './CommandPalette';
import type { CommandPaletteGroup } from './CommandPalette';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';

const meta: Meta<typeof CommandPalette> = {
  title: 'Navigation/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

const groups: CommandPaletteGroup[] = [
  {
    id: 'navigation',
    heading: 'Navigation',
    items: [
      { id: 'go-dashboard', label: 'Go to Dashboard', shortcut: 'G D', onSelect: () => {} },
      { id: 'go-settings', label: 'Go to Settings', shortcut: 'G S', onSelect: () => {} },
    ],
  },
  {
    id: 'actions',
    heading: 'Actions',
    items: [
      {
        id: 'new-project',
        label: 'New Project',
        description: 'Start a project from a template',
        keywords: ['create'],
        onSelect: () => {},
      },
      {
        id: 'invite',
        label: 'Invite Teammate',
        keywords: ['add', 'member'],
        onSelect: () => {},
      },
      { id: 'delete-project', label: 'Delete Project', disabled: true, onSelect: () => {} },
    ],
  },
];

/**
 * `defaultOpen` for demo purposes — in real usage the palette starts
 * closed and opens via the Cmd/Ctrl+K hotkey (`hotkey`, default `true`) or
 * your own trigger calling `onOpenChange`.
 */
export const Default: Story = {
  render: () => <CommandPalette groups={groups} defaultOpen hotkey={false} />,
};

export const FlatItems: Story = {
  render: () => (
    <CommandPalette
      items={[
        { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: () => {} },
        { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: () => {} },
        { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', onSelect: () => {} },
      ]}
      defaultOpen
      hotkey={false}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <CommandPalette
      items={[{ id: 'x', label: 'Something', onSelect: () => {} }]}
      defaultOpen
      hotkey={false}
    />
  ),
};

/** Press Cmd+K (or Ctrl+K) anywhere in this story to open the palette. */
export const HotkeyTrigger: Story = {
  render: function HotkeyTriggerStory() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          Press ⌘K / Ctrl+K to open.
        </Text>
        <CommandPalette groups={groups} open={open} onOpenChange={setOpen} />
      </>
    );
  },
};

export const Accessibility: Story = {
  render: () => <CommandPalette groups={groups} defaultOpen hotkey={false} />,
};

export const Controlled: Story = {
  render: function ControlledCommandPalette() {
    const [open, setOpen] = useState(false);
    const [lastSelected, setLastSelected] = useState<string | undefined>();
    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)} style={{ marginBottom: 8 }}>
          Open command palette
        </Button>
        <Text size="sm">Last selected: {lastSelected ?? 'none'}</Text>
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          hotkey={false}
          items={[
            { id: 'a', label: 'Action A', onSelect: () => setLastSelected('Action A') },
            { id: 'b', label: 'Action B', onSelect: () => setLastSelected('Action B') },
          ]}
        />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => {
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          Manages its own open state — press Escape to close after opening below.
        </Text>
        <CommandPalette groups={groups} defaultOpen hotkey={false} />
      </>
    );
  },
};
