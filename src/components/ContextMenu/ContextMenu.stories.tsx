import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu } from './ContextMenu';
import { MenuItem } from '../Menu/Menu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Navigation/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu
      menu={
        <>
          <MenuItem onSelect={() => console.log('Copy')}>Copy</MenuItem>
          <MenuItem onSelect={() => console.log('Paste')}>Paste</MenuItem>
          <MenuItem disabled onSelect={() => console.log('Delete')}>
            Delete (disabled)
          </MenuItem>
        </>
      }
    >
      <div
        style={{
          width: 280,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--ds-color-border-primary)',
          borderRadius: 'var(--ds-radius-md)',
          color: 'var(--ds-color-text-secondary)',
        }}
      >
        Right-click anywhere in this box
      </div>
    </ContextMenu>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ContextMenu disabled menu={<MenuItem>Copy</MenuItem>}>
      <div
        style={{
          width: 280,
          height: 100,
          border: '1px dashed var(--ds-color-border-primary)',
          borderRadius: 'var(--ds-radius-md)',
        }}
      >
        Context menu disabled — shows the browser&apos;s native menu instead
      </div>
    </ContextMenu>
  ),
};

/**
 * `aiSuggest` is forwarded straight to the internal `Menu` — see `Menu`'s
 * own `WithAISuggest` story for the shared shape. Resolved items get the
 * same "also close the menu" wrapping every other item already gets.
 */
export const WithAISuggest: Story = {
  render: () => (
    <ContextMenu
      menu={
        <>
          <MenuItem onSelect={() => console.log('Copy')}>Copy</MenuItem>
          <MenuItem onSelect={() => console.log('Paste')}>Paste</MenuItem>
        </>
      }
      aiSuggest={{
        resolve: async () => [
          { id: 'archive', label: 'Archive', onSelect: () => console.log('Archive') },
        ],
      }}
    >
      <div
        style={{
          width: 280,
          height: 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px dashed var(--ds-color-border-primary)',
          borderRadius: 'var(--ds-radius-md)',
          color: 'var(--ds-color-text-secondary)',
        }}
      >
        Right-click anywhere in this box
      </div>
    </ContextMenu>
  ),
};
