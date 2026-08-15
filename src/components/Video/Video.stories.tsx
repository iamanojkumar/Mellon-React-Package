import type { Meta, StoryObj } from '@storybook/react';
import { Video } from './Video';

const SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const POSTER = 'https://interactive-examples.mdn.mozilla.net/media/examples/poster-flower.jpg';

const meta: Meta<typeof Video> = {
  title: 'Media/Video',
  component: Video,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Video>;

export const Default: Story = {
  args: {
    src: SRC,
    'aria-label': 'Flower opening',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Video {...args} />
    </div>
  ),
};

export const WithPoster: Story = {
  args: {
    src: SRC,
    poster: POSTER,
    'aria-label': 'Flower opening',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Video {...args} />
    </div>
  ),
};

export const AutoPlayLoop: Story = {
  name: 'Autoplay + loop (starts muted per browser policy)',
  args: {
    src: SRC,
    autoPlay: true,
    loop: true,
    'aria-label': 'Flower opening, looping',
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Video {...args} />
    </div>
  ),
};

export const WithCaptions: Story = {
  args: {
    src: SRC,
    'aria-label': 'Flower opening with captions',
    captions: [
      {
        src: 'data:text/vtt,WEBVTT%0A%0A00:00.000%20--%3E%2000:10.000%0ADemo%20caption%20track',
        srcLang: 'en',
        label: 'English',
        default: true,
      },
    ],
  },
  render: (args) => (
    <div style={{ maxWidth: 480 }}>
      <Video {...args} />
    </div>
  ),
};
