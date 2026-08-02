import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CommandPalette } from './CommandPalette';
import type { CommandPaletteGroup, CommandPaletteItem } from './CommandPalette';
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
 * Starts closed and opens via a trigger button — like every other
 * `Dialog`-based story in this codebase (see `Dialog.stories.tsx`), not
 * `defaultOpen`. `CommandPalette`'s `Dialog` renders a full-viewport
 * Portal-ed backdrop; autodocs pages mount every story's demo
 * simultaneously, so `defaultOpen` on multiple stories stacked several
 * full-viewport backdrops on top of each other.
 */
export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            Open command palette
          </Button>
          <CommandPalette groups={groups} open={open} onOpenChange={setOpen} hotkey={false} />
        </>
      );
    }
    return <Demo />;
  },
};

export const FlatItems: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            Open command palette
          </Button>
          <CommandPalette
            items={[
              { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: () => {} },
              { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: () => {} },
              { id: 'duplicate', label: 'Duplicate', shortcut: '⌘D', onSelect: () => {} },
            ]}
            open={open}
            onOpenChange={setOpen}
            hotkey={false}
          />
        </>
      );
    }
    return <Demo />;
  },
};

export const Empty: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            Open command palette
          </Button>
          <CommandPalette
            items={[{ id: 'x', label: 'Something', onSelect: () => {} }]}
            open={open}
            onOpenChange={setOpen}
            hotkey={false}
          />
        </>
      );
    }
    return <Demo />;
  },
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
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            Open command palette
          </Button>
          <CommandPalette groups={groups} open={open} onOpenChange={setOpen} hotkey={false} />
        </>
      );
    }
    return <Demo />;
  },
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
    /**
     * Mounted (with `defaultOpen`, no `open`/`onOpenChange`) only once the
     * trigger is clicked — demonstrates the uncontrolled path without
     * relying on `defaultOpen` at initial page render, which would open
     * multiple palettes at once on the autodocs page.
     */
    function Demo() {
      const [mounted, setMounted] = useState(false);
      return (
        <>
          <Text size="sm" style={{ marginBottom: 8 }}>
            Manages its own open state — press Escape to close after opening below.
          </Text>
          {mounted ? (
            <CommandPalette groups={groups} defaultOpen hotkey={false} />
          ) : (
            <Button size="sm" onClick={() => setMounted(true)}>
              Open command palette
            </Button>
          )}
        </>
      );
    }
    return <Demo />;
  },
};

/**
 * `aiSearch` never calls `AIClient`/`useAIAction` itself — turning freeform
 * AI text into safely-executable actions is app-specific, so `onQuery` is
 * entirely the consumer's own function resolving to real
 * `CommandPaletteItem[]`. Type something that doesn't match any local item
 * (e.g. "deploy") to see the synthesized "Suggested" group appear after a
 * short debounce.
 */
export const WithAISearch: Story = {
  render: () => {
    async function onQuery(query: string): Promise<CommandPaletteItem[]> {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return [
        {
          id: 'ai-1',
          label: `Run "${query}"`,
          description: 'AI-suggested command based on your query',
          onSelect: () => {},
        },
      ];
    }
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button size="sm" onClick={() => setOpen(true)}>
            Open command palette
          </Button>
          <CommandPalette
            groups={groups}
            open={open}
            onOpenChange={setOpen}
            hotkey={false}
            aiSearch={{ onQuery }}
          />
        </>
      );
    }
    return <Demo />;
  },
};
