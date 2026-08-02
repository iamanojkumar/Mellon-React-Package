import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Carousel } from './Carousel';
import { Text } from '../Text/Text';

const meta: Meta<typeof Carousel> = {
  title: 'Media/Carousel',
  component: Carousel,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Carousel>;

// Dark enough shades that white slide-label text clears WCAG AA contrast
// against every color in the set (verified via pnpm test:storybook) — the
// lighter 500-level versions of this same palette (e.g. yellow) do not.
const palette = ['#b91c1c', '#c2410c', '#a16207', '#15803d', '#1d4ed8'];

function ColorSlide({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: color,
        color: 'white',
        fontFamily: 'var(--ds-font-family-base)',
        fontSize: 'var(--ds-font-size-lg)',
        fontWeight: 'var(--ds-font-weight-bold)',
      }}
    >
      {label}
    </div>
  );
}

export const Default: Story = {
  render: () => (
    <Carousel aria-label="Colors">
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const AutoPlay: Story = {
  render: () => (
    <Carousel aria-label="Colors" autoPlay autoPlayInterval={2500}>
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const NoLoop: Story = {
  render: () => (
    <Carousel aria-label="Colors" loop={false}>
      {palette.slice(0, 3).map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const WithoutIndicators: Story = {
  render: () => (
    <Carousel aria-label="Colors" showIndicators={false}>
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 280 }}>
      <Carousel aria-label="Colors">
        {palette.map((color, i) => (
          <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
        ))}
      </Carousel>
    </div>
  ),
};

/**
 * Focus the region (Tab to a control inside it, e.g. "Next slide") and use
 * ArrowLeft/ArrowRight to move between slides. Swipe left/right on the
 * slide itself also works with a mouse/touch drag.
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <Carousel aria-label="Colors">
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <Carousel aria-label="Colors" autoPlay>
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};

export const Controlled: Story = {
  render: function ControlledCarousel() {
    const [index, setIndex] = useState(0);
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          Slide {index + 1} of {palette.length}
        </Text>
        <Carousel aria-label="Colors" index={index} onIndexChange={setIndex}>
          {palette.map((color, i) => (
            <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
          ))}
        </Carousel>
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <Carousel aria-label="Colors" defaultIndex={1}>
      {palette.map((color, i) => (
        <ColorSlide key={color} color={color} label={`Slide ${i + 1}`} />
      ))}
    </Carousel>
  ),
};
