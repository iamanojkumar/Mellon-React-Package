import type { Meta, StoryObj } from '@storybook/react';
import { VisuallyHidden } from './VisuallyHidden';

const meta: Meta<typeof VisuallyHidden> = {
  title: 'Foundations/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VisuallyHidden>;

/**
 * Renders visually as an icon-only button, but a screen reader announces
 * "Close" via the visually-hidden text — inspect the accessibility tree
 * (or the addon-a11y panel) to see it; nothing is visible on screen.
 */
export const IconOnlyButtonLabel: Story = {
  render: () => (
    <button type="button" style={{ padding: 'var(--ds-space-sm)' }}>
      <span aria-hidden="true">×</span>
      <VisuallyHidden>Close</VisuallyHidden>
    </button>
  ),
};
