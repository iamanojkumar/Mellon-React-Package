import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { Button } from '../Button/Button';
import { Card } from '../Card/Card';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'Feedback/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

export const FullScreen: Story = {
  render: () => {
    function Demo() {
      const [loading, setLoading] = useState(false);
      return (
        <>
          <Button onClick={() => setLoading(true)}>Show full-screen overlay</Button>
          {loading && <LoadingOverlay label="Loading…" onClick={() => setLoading(false)} />}
        </>
      );
    }
    return <Demo />;
  },
};

export const Contained: Story = {
  render: () => (
    <Card style={{ position: 'relative', width: 320, height: 200 }}>
      <p>Card content sits behind the overlay.</p>
      <LoadingOverlay fullScreen={false} label="Loading" />
    </Card>
  ),
};

export const WithoutLabel: Story = {
  render: () => (
    <Card style={{ position: 'relative', width: 320, height: 200 }}>
      <p>Icon-only overlay — &ldquo;Loading&rdquo; is still announced to screen readers.</p>
      <LoadingOverlay fullScreen={false} />
    </Card>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24 }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Card key={size} style={{ position: 'relative', width: 160, height: 160 }}>
          <LoadingOverlay fullScreen={false} size={size} label={size} />
        </Card>
      ))}
    </div>
  ),
};
