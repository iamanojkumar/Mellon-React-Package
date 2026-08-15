import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Audio } from './Audio';
import type { AudioTrimRange } from './Audio';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3';

const meta: Meta<typeof Audio> = {
  title: 'Media/Audio',
  component: Audio,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Audio>;

export const Default: Story = {
  args: {
    src: SRC,
    'aria-label': 'T-Rex roar',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Audio {...args} />
    </div>
  ),
};

export const Trimmable: Story = {
  args: {
    src: SRC,
    trimmable: true,
    'aria-label': 'T-Rex roar',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Audio {...args} />
    </div>
  ),
};

export const PlayTrimmedSelectionOnly: Story = {
  name: 'Trimmable, playback constrained to the selection',
  args: {
    src: SRC,
    trimmable: true,
    playTrimmedOnly: true,
    loop: true,
    'aria-label': 'T-Rex roar',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Audio {...args} />
    </div>
  ),
};

export const ControlledTrimRange: Story = {
  render: () => {
    function Demo() {
      const [range, setRange] = useState<AudioTrimRange>({ start: 0, end: 0 });
      return (
        <Stack gap="xs" style={{ maxWidth: 480 }}>
          <Audio
            src={SRC}
            trimmable
            trimRange={range}
            onTrimChange={setRange}
            aria-label="T-Rex roar"
          />
          <Text size="sm" color="secondary">
            Trim: {range.start.toFixed(1)}s – {range.end.toFixed(1)}s
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
