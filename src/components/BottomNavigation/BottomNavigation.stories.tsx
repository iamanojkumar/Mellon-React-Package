import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation';
import { Badge } from '../Badge/Badge';

const meta: Meta<typeof BottomNavigation> = {
  title: 'Mobile/BottomNavigation',
  component: BottomNavigation,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof BottomNavigation>;

const homeIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 9l7-6 7 6v8a1 1 0 0 1-1 1h-4v-6H8v6H4a1 1 0 0 1-1-1V9z" fill="currentColor" />
  </svg>
);
const searchIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const profileIcon = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 17c1-3 4-5 6-5s5 2 6 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/**
 * Demo-only wrapper: `position: fixed` (the component's real, correct
 * behavior) is relative to the viewport, not a `position: relative`
 * ancestor — `contain: layout` is what actually establishes a new
 * containing block for a `fixed` descendant, keeping this story's bar
 * inside the frame instead of pinned to the whole preview iframe.
 */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        contain: 'layout',
        height: 240,
        border: '1px solid var(--ds-color-border-primary)',
      }}
    >
      {children}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <Frame>
      <BottomNavigation>
        <BottomNavigation.Item href="/" icon={homeIcon} active>
          Home
        </BottomNavigation.Item>
        <BottomNavigation.Item href="/search" icon={searchIcon}>
          Search
        </BottomNavigation.Item>
        <BottomNavigation.Item href="/profile" icon={profileIcon}>
          Profile
        </BottomNavigation.Item>
      </BottomNavigation>
    </Frame>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <Frame>
      <BottomNavigation>
        <BottomNavigation.Item href="/" icon={homeIcon} active>
          Home
        </BottomNavigation.Item>
        <BottomNavigation.Item
          href="/profile"
          icon={profileIcon}
          badge={
            <Badge color="danger" variant="solid">
              3
            </Badge>
          }
        >
          Profile
        </BottomNavigation.Item>
      </BottomNavigation>
    </Frame>
  ),
};

/**
 * Tab to an item, then use ArrowLeft/ArrowRight to move between items (each
 * item stays individually reachable by Tab too — see this component's own
 * doc comment), or Home/End to jump to the first/last.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Frame>
      <BottomNavigation>
        <BottomNavigation.Item href="/" icon={homeIcon} active>
          Home
        </BottomNavigation.Item>
        <BottomNavigation.Item href="/search" icon={searchIcon}>
          Search
        </BottomNavigation.Item>
        <BottomNavigation.Item href="/profile" icon={profileIcon}>
          Profile
        </BottomNavigation.Item>
      </BottomNavigation>
    </Frame>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Frame>
      <BottomNavigation>
        <BottomNavigation.Item href="/" icon={homeIcon} active>
          Home
        </BottomNavigation.Item>
      </BottomNavigation>
    </Frame>
  ),
};
