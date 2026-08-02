import type { Meta, StoryObj } from '@storybook/react';
import { Figure } from './Figure';
import { Image } from '../Image/Image';

const meta: Meta<typeof Figure> = {
  title: 'Media/Figure',
  component: Figure,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Figure>;

export const Default: Story = {
  render: () => (
    <Figure caption="A mountain landscape at sunrise." style={{ maxWidth: 240 }}>
      <Image
        src="https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400"
        alt="Mountain landscape"
        rounded
      />
    </Figure>
  ),
};
