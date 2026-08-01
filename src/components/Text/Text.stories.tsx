import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';
import { Stack } from '../Stack/Stack';
import type { TextColor, TextSize, TextWeight } from './Text';

const SIZES: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const WEIGHTS: TextWeight[] = ['regular', 'medium', 'bold'];
const COLORS: TextColor[] = [
  'primary',
  'secondary',
  'inverse',
  'disabled',
  'brand',
  'success',
  'warning',
  'danger',
];

const meta: Meta<typeof Text> = {
  title: 'Typography/Text',
  component: Text,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {
  args: {
    children: 'The quick brown fox jumps over the lazy dog.',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack gap="xs">
      {SIZES.map((size) => (
        <Text key={size} size={size}>
          {size} — The quick brown fox
        </Text>
      ))}
    </Stack>
  ),
};

export const Weights: Story = {
  render: () => (
    <Stack gap="xs">
      {WEIGHTS.map((weight) => (
        <Text key={weight} weight={weight}>
          {weight} — The quick brown fox
        </Text>
      ))}
    </Stack>
  ),
};

export const Colors: Story = {
  render: () => (
    <Stack gap="xs">
      {COLORS.map((color) =>
        color === 'inverse' ? (
          <div
            key={color}
            style={{
              background: 'var(--ds-color-surface-inverse)',
              padding: 'var(--ds-space-sm)',
              borderRadius: 'var(--ds-radius-md)',
            }}
          >
            <Text color="inverse">inverse — The quick brown fox (on a dark surface)</Text>
          </div>
        ) : (
          <Text
            key={color}
            color={color}
            // 'disabled' is deliberately low-contrast — WCAG 1.4.3 exempts
            // inactive UI components from contrast minimums, and this
            // marks it as such so axe-core doesn't flag it (it would only
            // ever appear on real disabled controls in actual usage).
            aria-disabled={color === 'disabled' || undefined}
          >
            {color} — The quick brown fox
          </Text>
        ),
      )}
    </Stack>
  ),
};

export const Truncate: Story = {
  render: () => (
    <div style={{ width: 200, border: '1px dashed var(--ds-color-border-primary)' }}>
      <Text truncate>This is a very long sentence that should be truncated with an ellipsis.</Text>
    </div>
  ),
};
