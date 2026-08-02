import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const ClickTriggered: Story = {
  render: () => (
    <Popover>
      <Popover.Trigger>Click me</Popover.Trigger>
      <Popover.Content>
        <div style={{ maxWidth: 200 }}>
          A generic panel positioned relative to its trigger, dismissed on outside click or Escape.
        </div>
      </Popover.Content>
    </Popover>
  ),
};

/**
 * `triggerMode="hover"` opens on pointer hover or keyboard focus, and
 * closes `closeDelay`ms after both the trigger and content lose hover/
 * focus — moving the pointer from the trigger into the content (as a real
 * hover card's content often needs, e.g. to click a link inside it)
 * cancels the pending close.
 */
export const HoverTriggered: Story = {
  render: () => (
    <Popover triggerMode="hover" closeDelay={150}>
      <Popover.Trigger>Hover me</Popover.Trigger>
      <Popover.Content role="tooltip">
        <div style={{ maxWidth: 200 }}>Appears on hover or focus, not click.</div>
      </Popover.Content>
    </Popover>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-xl)', paddingTop: 'var(--ds-space-xl)' }}>
      <Popover>
        <Popover.Trigger>bottom-start</Popover.Trigger>
        <Popover.Content placement="bottom-start">Content</Popover.Content>
      </Popover>
      <Popover>
        <Popover.Trigger>top-start</Popover.Trigger>
        <Popover.Content placement="top-start">Content</Popover.Content>
      </Popover>
      <Popover>
        <Popover.Trigger>right-start</Popover.Trigger>
        <Popover.Content placement="right-start">Content</Popover.Content>
      </Popover>
    </div>
  ),
};
