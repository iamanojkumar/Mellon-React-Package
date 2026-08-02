import type { Meta, StoryObj } from '@storybook/react';
import { Menu, MenuItem } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Navigation/Menu',
  component: Menu,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Menu>;

export const Default: Story = {
  render: () => (
    <Menu aria-label="Actions" style={{ width: 200 }}>
      <MenuItem onSelect={() => console.log('Edit selected')}>Edit</MenuItem>
      <MenuItem onSelect={() => console.log('Duplicate selected')}>Duplicate</MenuItem>
      <MenuItem disabled onSelect={() => console.log('Delete selected')}>
        Delete (disabled)
      </MenuItem>
    </Menu>
  ),
};

/**
 * Unlike `Dropdown.Menu` (which only exists inside an open `Dropdown`),
 * `Menu` can be displayed statically — e.g. a persistent sidebar/navbar
 * list — with real Tab-reachable roving focus rather than relying on an
 * overlay's own open/close lifecycle.
 */
export const StaticallyDisplayed: Story = {
  render: () => (
    <Menu aria-label="Sections" style={{ width: 200 }}>
      <MenuItem onSelect={() => console.log('Dashboard')}>Dashboard</MenuItem>
      <MenuItem onSelect={() => console.log('Settings')}>Settings</MenuItem>
      <MenuItem onSelect={() => console.log('Billing')}>Billing</MenuItem>
    </Menu>
  ),
};
