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
