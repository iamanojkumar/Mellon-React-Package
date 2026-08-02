import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';
import { Flex } from '../Flex/Flex';

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Delete account</Button>
          <Dialog open={open} onOpenChange={setOpen} title="Delete account?">
            <Text size="sm" color="secondary">
              This action can&apos;t be undone. All of your data will be permanently removed.
            </Text>
            <Flex gap="sm" style={{ marginTop: 'var(--ds-space-lg)' }} justify="end">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </Flex>
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};

export const HeaderBodyFooter: Story = {
  name: 'Header/Body/Footer parts',
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Edit profile</Button>
          <Dialog open={open} onOpenChange={setOpen} aria-label="Edit profile" size="lg">
            <Dialog.Header>
              <Text size="lg" weight="bold">
                Edit profile
              </Text>
            </Dialog.Header>
            <Dialog.Body>
              <Text size="sm" color="secondary">
                A scrollable middle section — the header stays pinned above it and the footer stays
                pinned below it, independent of how much content is here.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </Dialog.Footer>
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};

export const Sizes: Story = {
  render: () => {
    function Demo() {
      const [openSize, setOpenSize] = useState<'sm' | 'md' | 'lg' | 'full' | null>(null);
      return (
        <>
          <Flex gap="sm">
            <Button onClick={() => setOpenSize('sm')}>Small</Button>
            <Button onClick={() => setOpenSize('md')}>Medium</Button>
            <Button onClick={() => setOpenSize('lg')}>Large</Button>
            <Button onClick={() => setOpenSize('full')}>Full</Button>
          </Flex>
          <Dialog
            open={openSize !== null}
            onOpenChange={(next) => !next && setOpenSize(null)}
            title={`Size: ${openSize}`}
            size={openSize ?? 'md'}
          >
            <Text size="sm" color="secondary">
              This dialog is using size=&quot;{openSize}&quot;.
            </Text>
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};

export const WithoutCloseButton: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Dialog
            open={open}
            onOpenChange={setOpen}
            title="No close button"
            showCloseButton={false}
          >
            <Text size="sm" color="secondary">
              Only Escape, the backdrop, or an explicit in-content button can close this one.
            </Text>
            <Flex gap="sm" style={{ marginTop: 'var(--ds-space-lg)' }} justify="end">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </Flex>
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};

/**
 * Tab cycles within the dialog (it never escapes to the page behind it),
 * Escape closes it, and focus returns to the trigger button on close.
 */
export const KeyboardBehavior: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Dialog open={open} onOpenChange={setOpen} title="Keyboard demo">
            <Flex gap="sm" direction="column">
              <Text size="sm" color="secondary">
                Try Tab, Shift+Tab, and Escape.
              </Text>
              <Button variant="secondary">First</Button>
              <Button variant="secondary">Second</Button>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </Flex>
          </Dialog>
        </>
      );
    }
    return <Demo />;
  },
};
