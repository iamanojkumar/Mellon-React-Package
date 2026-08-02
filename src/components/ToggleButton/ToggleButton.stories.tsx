import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleButton } from './ToggleButton';

const meta: Meta<typeof ToggleButton> = {
  title: 'Buttons/ToggleButton',
  component: ToggleButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToggleButton>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [pressed, setPressed] = useState(false);
      return (
        <ToggleButton pressed={pressed} onPressedChange={setPressed}>
          <strong>B</strong>
        </ToggleButton>
      );
    }
    return <Demo />;
  },
};

export const Group: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-xs)' }}>
      <ToggleButton defaultPressed aria-label="Bold">
        <strong>B</strong>
      </ToggleButton>
      <ToggleButton aria-label="Italic">
        <em>I</em>
      </ToggleButton>
      <ToggleButton aria-label="Underline">
        <u>U</u>
      </ToggleButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => <ToggleButton disabled>Bold</ToggleButton>,
};
