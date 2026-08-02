import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider } from './ToastProvider';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/Button/Button';
import { Stack } from '../components/Stack/Stack';

const meta: Meta<typeof ToastProvider> = {
  title: 'Feedback/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

function BasicDemo() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ title: 'Saved', description: 'Your changes were saved.' })}>
      Show toast
    </Button>
  );
}

export const Default: Story = {
  render: () => (
    <ToastProvider>
      <BasicDemo />
    </ToastProvider>
  ),
};

function VariantsDemo() {
  const { toast } = useToast();
  return (
    <Stack gap="sm" style={{ width: 'max-content' }}>
      <Button
        onClick={() =>
          toast({ variant: 'info', title: 'Heads up', description: 'A new version is available.' })
        }
      >
        Info
      </Button>
      <Button
        onClick={() =>
          toast({ variant: 'success', title: 'Success', description: 'Your changes were saved.' })
        }
      >
        Success
      </Button>
      <Button
        onClick={() =>
          toast({ variant: 'warning', title: 'Warning', description: 'Your session expires soon.' })
        }
      >
        Warning
      </Button>
      <Button
        onClick={() =>
          toast({ variant: 'danger', title: 'Error', description: 'Something went wrong.' })
        }
      >
        Danger
      </Button>
    </Stack>
  );
}

export const Variants: Story = {
  render: () => (
    <ToastProvider>
      <VariantsDemo />
    </ToastProvider>
  ),
};

function ActionDemo() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() =>
        toast({
          title: 'Message deleted',
          action: { label: 'Undo', onClick: () => toast({ title: 'Delete undone' }) },
        })
      }
    >
      Delete message
    </Button>
  );
}

export const WithAction: Story = {
  render: () => (
    <ToastProvider>
      <ActionDemo />
    </ToastProvider>
  ),
};

function QueueDemo() {
  const { toast, dismissAll } = useToast();
  return (
    <Stack gap="sm" style={{ width: 'max-content' }}>
      <Button
        onClick={() => {
          toast({ title: 'First' });
          toast({ title: 'Second' });
          toast({ title: 'Third' });
        }}
      >
        Show 3 toasts
      </Button>
      <Button onClick={dismissAll}>Clear all</Button>
    </Stack>
  );
}

export const Queue: Story = {
  render: () => (
    <ToastProvider limit={3}>
      <QueueDemo />
    </ToastProvider>
  ),
};

function PersistentDemo() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() =>
        toast({
          variant: 'danger',
          title: 'Upload failed',
          description: 'Manually dismiss this one — it never auto-dismisses.',
          duration: 0,
        })
      }
    >
      Show persistent toast
    </Button>
  );
}

export const Persistent: Story = {
  render: () => (
    <ToastProvider>
      <PersistentDemo />
    </ToastProvider>
  ),
};

function PositionsDemo() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: 'Top-left toast' })}>Show toast</Button>;
}

export const TopLeftPosition: Story = {
  render: () => (
    <ToastProvider position="top-left">
      <PositionsDemo />
    </ToastProvider>
  ),
};
