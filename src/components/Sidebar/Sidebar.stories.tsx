import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

const meta: Meta<typeof Sidebar> = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Item href="/" active>
        Dashboard
      </Sidebar.Item>
      <Sidebar.Item href="/projects">Projects</Sidebar.Item>
      <Sidebar.Item href="/reports">Reports</Sidebar.Item>
    </Sidebar>
  ),
};

export const Grouped: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Item href="/" active>
        Dashboard
      </Sidebar.Item>
      <Sidebar.Group label="Workspace">
        <Sidebar.Item href="/projects">Projects</Sidebar.Item>
        <Sidebar.Item href="/reports">Reports</Sidebar.Item>
      </Sidebar.Group>
      <Sidebar.Group label="Account">
        <Sidebar.Item href="/settings">Settings</Sidebar.Item>
        <Sidebar.Item href="/billing" badge={<Badge color="brand">New</Badge>}>
          Billing
        </Sidebar.Item>
      </Sidebar.Group>
    </Sidebar>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Item
        href="/"
        active
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="5" height="5" fill="currentColor" />
            <rect x="9" y="2" width="5" height="5" fill="currentColor" />
            <rect x="2" y="9" width="5" height="5" fill="currentColor" />
            <rect x="9" y="9" width="5" height="5" fill="currentColor" />
          </svg>
        }
      >
        Dashboard
      </Sidebar.Item>
      <Sidebar.Item
        href="/settings"
        icon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        }
      >
        Settings
      </Sidebar.Item>
    </Sidebar>
  ),
};

/**
 * `actions` renders as a sibling of the item's own link/button, inside the
 * same `<li>` — a real "⋮" trigger next to the label rather than a second
 * interactive element nested inside the first (invalid HTML, and it would
 * break the item's own click handling).
 */
export const WithActions: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Item
        href="/"
        active
        actions={
          <Button size="sm" variant="ghost" aria-label="Rename Dashboard">
            ⋮
          </Button>
        }
      >
        Dashboard
      </Sidebar.Item>
      <Sidebar.Item
        href="/projects"
        actions={
          <Button size="sm" variant="ghost" aria-label="Rename Projects">
            ⋮
          </Button>
        }
      >
        Projects
      </Sidebar.Item>
    </Sidebar>
  ),
};

/**
 * `asDrawer` renders the same items through `Drawer` (`placement="left"`)
 * instead of an in-flow panel — pass this from your own responsive/
 * breakpoint logic to get a collapsible mobile Sidebar.
 */
export const AsDrawer: Story = {
  render: function AsDrawerSidebar() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button size="sm" onClick={() => setOpen(true)}>
          Open sidebar
        </Button>
        <Sidebar asDrawer open={open} onOpenChange={setOpen}>
          <Sidebar.Item href="/" active>
            Dashboard
          </Sidebar.Item>
          <Sidebar.Item href="/projects">Projects</Sidebar.Item>
        </Sidebar>
      </>
    );
  },
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 200 }}>
      <Sidebar>
        <Sidebar.Item href="/" active>
          Dashboard
        </Sidebar.Item>
        <Sidebar.Item href="/projects">Projects</Sidebar.Item>
      </Sidebar>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Sidebar>
      <Sidebar.Item href="/" active>
        Dashboard
      </Sidebar.Item>
    </Sidebar>
  ),
};

export const Controlled: Story = {
  render: function ControlledSidebar() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button size="sm" onClick={() => setOpen((current) => !current)}>
          {open ? 'Close' : 'Open'} sidebar
        </Button>
        <Sidebar asDrawer open={open} onOpenChange={setOpen}>
          <Sidebar.Item href="/" active>
            Dashboard
          </Sidebar.Item>
        </Sidebar>
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <Sidebar asDrawer defaultOpen>
      <Sidebar.Item href="/" active>
        Dashboard
      </Sidebar.Item>
    </Sidebar>
  ),
};
