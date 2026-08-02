import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Banner } from './Banner';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Banner> = {
  title: 'Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  args: {
    children: 'A new version of the app is available.',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="none">
      <Banner variant="info">A new version of the app is available.</Banner>
      <Banner variant="success">Your subscription has been renewed.</Banner>
      <Banner variant="warning">Scheduled maintenance begins in 1 hour.</Banner>
      <Banner variant="danger">Payment failed — update your billing details.</Banner>
    </Stack>
  ),
};

export const Dismissible: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      if (!visible) return null;
      return (
        <Banner variant="info" onDismiss={() => setVisible(false)}>
          A new version of the app is available.{' '}
          <a href="#refresh" onClick={(event) => event.preventDefault()}>
            Refresh now
          </a>
          .
        </Banner>
      );
    }
    return <Demo />;
  },
};
