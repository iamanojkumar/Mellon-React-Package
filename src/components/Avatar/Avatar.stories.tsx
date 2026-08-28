import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';
import type { AvatarColor, AvatarSize } from './Avatar';

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const COLORS: AvatarColor[] = ['neutral', 'info', 'success', 'warning', 'danger'];

// Real-looking account ids that happen to cover all five tints, so the story
// shows the range. The hash spreads uniformly (~20% per slot over any large
// key set), so six *arbitrary* accounts would collide on some tint — that's
// expected, and the tint is decoration, never an identifier.
const ACCOUNTS = [
  { id: 'acct_7ecd', name: 'Ada Lovelace' },
  { id: 'acct_39ac', name: 'Grace Hopper' },
  { id: 'acct_ec28', name: 'Alan Turing' },
  { id: 'acct_b34a', name: 'Katherine Johnson' },
  { id: 'acct_ed42', name: 'Edsger Dijkstra' },
];

const meta: Meta<typeof Avatar> = {
  title: 'Data Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {
  render: () => <Avatar name="Ada Lovelace" />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <Avatar key={size} name="Ada Lovelace" size={size} />
      ))}
    </div>
  ),
};

export const Square: Story = {
  render: () => <Avatar name="Ada Lovelace" shape="square" />,
};

/**
 * Tint is decoration, never meaning — the initials and the accessible name
 * carry identity, and the values are named for the foundation role each one
 * maps to, not for a status. Every tint is a `*-subtle` fill with its own
 * hue-matched `*-on-subtle` foreground, which is what keeps the initials
 * readable in light, dark and high-contrast alike (the toolbar's theme
 * switch is the check).
 */
export const Colors: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {COLORS.map((color) => (
        <Avatar key={color} name="Ada Lovelace" color={color} />
      ))}
    </div>
  ),
};

/**
 * `colorFrom` derives a stable tint from any key — an account id, an email
 * — so the same account looks the same on every screen and after a reload,
 * without the consuming app maintaining a palette of its own.
 */
export const DerivedFromKey: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {ACCOUNTS.map((account) => (
        <Avatar key={account.id} name={account.name} colorFrom={account.id} />
      ))}
    </div>
  ),
};
