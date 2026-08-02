import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Drawer } from './Drawer';
import type { DrawerPlacement } from './Drawer';
import { Button } from '../Button/Button';
import { Text } from '../Text/Text';
import { Flex } from '../Flex/Flex';

const meta: Meta<typeof Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open settings</Button>
          <Drawer open={open} onOpenChange={setOpen} title="Settings">
            <Text size="sm" color="secondary">
              Slides in from the right by default.
            </Text>
          </Drawer>
        </>
      );
    }
    return <Demo />;
  },
};

export const Placements: Story = {
  render: () => {
    function Demo() {
      const [placement, setPlacement] = useState<DrawerPlacement | null>(null);
      return (
        <>
          <Flex gap="sm">
            <Button onClick={() => setPlacement('left')}>Left</Button>
            <Button onClick={() => setPlacement('right')}>Right</Button>
            <Button onClick={() => setPlacement('top')}>Top</Button>
            <Button onClick={() => setPlacement('bottom')}>Bottom</Button>
          </Flex>
          <Drawer
            open={placement !== null}
            onOpenChange={(next) => !next && setPlacement(null)}
            title={`Placement: ${placement}`}
            placement={placement ?? 'right'}
          >
            <Text size="sm" color="secondary">
              This drawer opened with placement=&quot;{placement}&quot;.
            </Text>
          </Drawer>
        </>
      );
    }
    return <Demo />;
  },
};

/**
 * `placement="bottom"` — the preset that covers "Bottom Sheet." Drag the
 * small handle at the top of the panel down to dismiss it, or use
 * Escape/backdrop click like any other Drawer.
 */
export const BottomSheet: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open bottom sheet</Button>
          <Drawer open={open} onOpenChange={setOpen} placement="bottom" title="Filters">
            <Text size="sm" color="secondary">
              Drag the handle down, or press Escape, to dismiss.
            </Text>
          </Drawer>
        </>
      );
    }
    return <Demo />;
  },
};

/**
 * "Action Sheet" (Mobile category) is just this same component — a
 * bottom-placement preset holding a list of actions, no separate
 * component or API needed.
 */
export const ActionSheet: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open action sheet</Button>
          <Drawer
            open={open}
            onOpenChange={setOpen}
            placement="bottom"
            aria-label="Actions"
            size="sm"
          >
            <Flex direction="column" gap="xs">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Share
              </Button>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Duplicate
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Delete
              </Button>
            </Flex>
          </Drawer>
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
          <Drawer open={open} onOpenChange={setOpen} aria-label="Edit profile" size="lg">
            <Drawer.Header>
              <Text size="lg" weight="bold">
                Edit profile
              </Text>
            </Drawer.Header>
            <Drawer.Body>
              <Text size="sm" color="secondary">
                The header and footer stay pinned while this middle section scrolls independently,
                same as Dialog&apos;s Header/Body/Footer.
              </Text>
            </Drawer.Body>
            <Drawer.Footer>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </Drawer.Footer>
          </Drawer>
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
          <Drawer
            open={openSize !== null}
            onOpenChange={(next) => !next && setOpenSize(null)}
            title={`Size: ${openSize}`}
            size={openSize ?? 'md'}
          >
            <Text size="sm" color="secondary">
              This drawer is using size=&quot;{openSize}&quot;.
            </Text>
          </Drawer>
        </>
      );
    }
    return <Demo />;
  },
};
