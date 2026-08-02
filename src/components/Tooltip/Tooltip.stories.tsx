import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Saves your changes">
      <Button>Save</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-2xl)', padding: 'var(--ds-space-xl)' }}>
      <Tooltip content="Top" placement="top">
        <Button variant="secondary">Top</Button>
      </Tooltip>
      <Tooltip content="Right" placement="right">
        <Button variant="secondary">Right</Button>
      </Tooltip>
      <Tooltip content="Bottom" placement="bottom">
        <Button variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Left" placement="left">
        <Button variant="secondary">Left</Button>
      </Tooltip>
    </div>
  ),
};

/** Works on any focusable element, not just `Button` — Tab to it to see the tooltip appear on keyboard focus, same as on hover. */
export const OnPlainText: Story = {
  render: () => (
    <p>
      Struggling with{' '}
      <Tooltip content="Cascading Style Sheets">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the WAI-ARIA tooltip pattern explicitly recommends making an otherwise-inert trigger (like an abbreviation) focusable so keyboard users can reach the tooltip too */}
        <abbr tabIndex={0} style={{ cursor: 'help' }}>
          CSS
        </abbr>
      </Tooltip>
      ? We can help.
    </p>
  ),
};
