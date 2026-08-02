import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Alert } from './Alert';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: 'Heads up',
    children: 'This is an informational message.',
  },
};

export const Variants: Story = {
  render: () => (
    <Stack gap="sm">
      <Alert variant="info" title="Info">
        A neutral, informational message.
      </Alert>
      <Alert variant="success" title="Success">
        Your changes were saved.
      </Alert>
      <Alert variant="warning" title="Warning">
        Your session will expire in 5 minutes.
      </Alert>
      <Alert variant="danger" title="Error">
        Something went wrong. Please try again.
      </Alert>
    </Stack>
  ),
};

export const WithoutTitle: Story = {
  args: {
    variant: 'success',
    children: 'A one-line alert with no title.',
  },
};

export const Dismissible: Story = {
  render: () => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      if (!visible) return null;
      return (
        <Alert variant="warning" title="Storage almost full" onDismiss={() => setVisible(false)}>
          You&apos;re using 92% of your available storage.
        </Alert>
      );
    }
    return <Demo />;
  },
};
