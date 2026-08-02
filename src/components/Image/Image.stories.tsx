import type { Meta, StoryObj } from '@storybook/react';
import { Image } from './Image';

const meta: Meta<typeof Image> = {
  title: 'Media/Image',
  component: Image,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Image>;

const SRC = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400';

export const Default: Story = {
  render: () => <Image src={SRC} alt="Mountain landscape" style={{ width: 240 }} />,
};

export const WithRatioAndRounded: Story = {
  render: () => (
    <Image src={SRC} alt="Mountain landscape" ratio={16 / 9} rounded style={{ width: 320 }} />
  ),
};

export const ObjectFitContain: Story = {
  render: () => (
    <div style={{ width: 240, height: 160, background: 'var(--ds-color-surface-secondary)' }}>
      <Image
        src={SRC}
        alt="Mountain landscape"
        fit="contain"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  ),
};
