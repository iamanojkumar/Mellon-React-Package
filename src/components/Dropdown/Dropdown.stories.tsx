import type { Meta, StoryObj } from '@storybook/react';
import { Dropdown } from './Dropdown';

const meta: Meta<typeof Dropdown> = {
  title: 'Navigation/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Trigger>Options</Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Item onSelect={() => console.log('Edit selected')}>Edit</Dropdown.Item>
        <Dropdown.Item onSelect={() => console.log('Duplicate selected')}>Duplicate</Dropdown.Item>
        <Dropdown.Item disabled onSelect={() => console.log('Delete selected')}>
          Delete (disabled)
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-xl)', paddingTop: 'var(--ds-space-xl)' }}>
      <Dropdown>
        <Dropdown.Trigger>bottom-start</Dropdown.Trigger>
        <Dropdown.Menu placement="bottom-start">
          <Dropdown.Item>Item one</Dropdown.Item>
          <Dropdown.Item>Item two</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown>
        <Dropdown.Trigger>top-start</Dropdown.Trigger>
        <Dropdown.Menu placement="top-start">
          <Dropdown.Item>Item one</Dropdown.Item>
          <Dropdown.Item>Item two</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
      <Dropdown>
        <Dropdown.Trigger>right-start</Dropdown.Trigger>
        <Dropdown.Menu placement="right-start">
          <Dropdown.Item>Item one</Dropdown.Item>
          <Dropdown.Item>Item two</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  ),
};

/**
 * Click the trigger to open, then ArrowDown/ArrowUp to move between items,
 * Home/End to jump to the first/last, Escape to close (focus returns to
 * the trigger), or Tab to close without trapping focus.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Trigger>Actions</Dropdown.Trigger>
      <Dropdown.Menu>
        <Dropdown.Item>First</Dropdown.Item>
        <Dropdown.Item>Second</Dropdown.Item>
        <Dropdown.Item disabled>Third (disabled)</Dropdown.Item>
        <Dropdown.Item>Fourth</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  ),
};

/**
 * `aiSuggest` follows `Menu`'s resolver shape — no shared AI primitive,
 * `resolve` is entirely consumer-owned. Unlike a resolved item, the
 * trigger item itself doesn't close the menu, so results stay visible.
 */
export const WithAISuggest: Story = {
  render: () => (
    <Dropdown>
      <Dropdown.Trigger>Options</Dropdown.Trigger>
      <Dropdown.Menu
        aiSuggest={{
          resolve: async () => [
            { id: 'archive', label: 'Archive', onSelect: () => console.log('Archive') },
            { id: 'star', label: 'Star', onSelect: () => console.log('Star') },
          ],
        }}
      >
        <Dropdown.Item onSelect={() => console.log('Edit')}>Edit</Dropdown.Item>
        <Dropdown.Item onSelect={() => console.log('Duplicate')}>Duplicate</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  ),
};
