import type { Meta, StoryObj } from '@storybook/react';
import { Navbar } from './Navbar';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';
import { Link } from '../Link/Link';

const meta: Meta<typeof Navbar> = {
  title: 'Navigation/Navbar',
  component: Navbar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Navbar>;

export const Default: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>Mellon</Navbar.Brand>
      <Navbar.Content>
        <Link href="/" color="primary">
          Home
        </Link>
        <Link href="/docs" color="primary">
          Docs
        </Link>
        <Link href="/pricing" color="primary">
          Pricing
        </Link>
      </Navbar.Content>
      <Navbar.Actions>
        <Button variant="secondary" size="sm">
          Sign in
        </Button>
        <Button size="sm">Sign up</Button>
      </Navbar.Actions>
    </Navbar>
  ),
};

export const WithAvatar: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>Mellon</Navbar.Brand>
      <Navbar.Content>
        <Link href="/" color="primary">
          Dashboard
        </Link>
        <Link href="/projects" color="primary">
          Projects
        </Link>
      </Navbar.Content>
      <Navbar.Actions>
        <Avatar name="Jordan Lee" size="sm" />
      </Navbar.Actions>
    </Navbar>
  ),
};

export const Sticky: Story = {
  render: () => (
    <div
      style={{ height: 300, overflow: 'auto', border: '1px solid var(--ds-color-border-primary)' }}
    >
      <Navbar sticky>
        <Navbar.Brand>Mellon</Navbar.Brand>
        <Navbar.Content>
          <Link href="/" color="primary">
            Home
          </Link>
        </Navbar.Content>
      </Navbar>
      <div style={{ padding: 16, height: 800 }}>Scroll to see the navbar stay pinned.</div>
    </div>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Navbar>
        <Navbar.Brand>Mellon</Navbar.Brand>
        <Navbar.Actions>
          <Button size="sm">Menu</Button>
        </Navbar.Actions>
      </Navbar>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Navbar>
      <Navbar.Brand>Mellon</Navbar.Brand>
      <Navbar.Content>
        <Link href="/" color="primary">
          Home
        </Link>
      </Navbar.Content>
    </Navbar>
  ),
};
