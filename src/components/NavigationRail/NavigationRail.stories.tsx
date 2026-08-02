import type { Meta, StoryObj } from '@storybook/react';
import { NavigationRail } from './NavigationRail';
import { Badge } from '../Badge/Badge';

const meta: Meta<typeof NavigationRail> = {
  title: 'Navigation/NavigationRail',
  component: NavigationRail,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof NavigationRail>;

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

export const Default: Story = {
  render: () => (
    <div style={{ height: 320 }}>
      <NavigationRail>
        <NavigationRail.Item href="/" icon={homeIcon} active>
          Home
        </NavigationRail.Item>
        <NavigationRail.Item href="/search" icon={searchIcon}>
          Search
        </NavigationRail.Item>
        <NavigationRail.Item href="/profile" icon={profileIcon}>
          Profile
        </NavigationRail.Item>
      </NavigationRail>
    </div>
  ),
};

export const WithBadge: Story = {
  render: () => (
    <div style={{ height: 320 }}>
      <NavigationRail>
        <NavigationRail.Item href="/" icon={homeIcon} active>
          Home
        </NavigationRail.Item>
        <NavigationRail.Item
          href="/profile"
          icon={profileIcon}
          badge={
            <Badge color="danger" variant="solid">
              3
            </Badge>
          }
        >
          Profile
        </NavigationRail.Item>
      </NavigationRail>
    </div>
  ),
};

/**
 * Tab to an item, then use ArrowUp/ArrowDown to move between items (each
 * item stays individually reachable by Tab too — see this component's own
 * doc comment), or Home/End to jump to the first/last.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <div style={{ height: 320 }}>
      <NavigationRail>
        <NavigationRail.Item href="/" icon={homeIcon} active>
          Home
        </NavigationRail.Item>
        <NavigationRail.Item href="/search" icon={searchIcon}>
          Search
        </NavigationRail.Item>
        <NavigationRail.Item href="/profile" icon={profileIcon}>
          Profile
        </NavigationRail.Item>
      </NavigationRail>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div style={{ height: 200 }}>
      <NavigationRail>
        <NavigationRail.Item href="/" icon={homeIcon} active>
          Home
        </NavigationRail.Item>
      </NavigationRail>
    </div>
  ),
};
