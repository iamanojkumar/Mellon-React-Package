import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ColorPicker } from './ColorPicker';
import { Text } from '../Text/Text';

const meta: Meta<typeof ColorPicker> = {
  title: 'Inputs/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  render: () => <ColorPicker defaultValue="#3b82f6" />,
};

export const WithPresets: Story = {
  render: () => (
    <ColorPicker
      defaultValue="#3b82f6"
      presets={['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']}
    />
  ),
};

export const Disabled: Story = {
  render: () => <ColorPicker defaultValue="#3b82f6" disabled presets={['#ef4444', '#22c55e']} />,
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 220 }}>
      <ColorPicker defaultValue="#3b82f6" />
    </div>
  ),
};

/**
 * Tab to the square or the hue track, then use Arrow keys to adjust —
 * Left/Right and Up/Down move saturation/brightness on the square,
 * Left/Right move hue on the track. Hold Shift for a bigger step.
 */
export const KeyboardNavigation: Story = {
  render: () => <ColorPicker defaultValue="#3b82f6" />,
};

export const Accessibility: Story = {
  render: () => <ColorPicker defaultValue="#3b82f6" presets={['#ef4444', '#22c55e']} />,
};

export const Controlled: Story = {
  render: function ControlledColorPicker() {
    const [value, setValue] = useState('#3b82f6');
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          {value}
        </Text>
        <ColorPicker value={value} onChange={setValue} />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => <ColorPicker defaultValue="#8b5cf6" />,
};
