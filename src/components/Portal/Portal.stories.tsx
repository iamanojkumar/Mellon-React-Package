import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Portal } from './Portal';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

const meta: Meta<typeof Portal> = {
  title: 'Utilities/Portal',
  component: Portal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Portal>;

/**
 * `<Portal>` is placed inside the dashed box below, but its children render
 * into `document.body` instead — outside the dashed box entirely, wherever
 * this story happens to mount in the DOM. That's the point: it escapes the
 * parent's layout/overflow/z-index while staying in the same React tree
 * logically (for context, event bubbling, etc). See "CustomContainer" for
 * a version that portals into a specific, visible target.
 */
export const Default: Story = {
  render: () => (
    <Box p="md" style={{ border: '1px dashed var(--ds-color-border-primary)' }}>
      <Text weight="medium">
        &lt;Portal&gt; is rendered here, but its content is appended to document.body — check the
        DOM tree in devtools.
      </Text>
      <Portal>
        <Box
          p="sm"
          style={{
            marginTop: 'var(--ds-space-sm)',
            border: '1px solid var(--ds-color-border-focus)',
            background: 'var(--ds-color-surface-secondary)',
            display: 'inline-block',
          }}
        >
          <Text color="brand">I actually live in document.body.</Text>
        </Box>
      </Portal>
    </Box>
  ),
};

export const CustomContainer: Story = {
  render: () => {
    function Demo() {
      const containerRef = useRef<HTMLDivElement>(null);
      const [ready, setReady] = useState(false);

      return (
        <Box style={{ display: 'flex', gap: 'var(--ds-space-md)' }}>
          <Box p="md" style={{ border: '1px dashed var(--ds-color-border-primary)', flex: 1 }}>
            <Text weight="medium">Source location</Text>
            {ready && (
              <Portal container={containerRef.current ?? undefined}>
                <Text color="brand">Portaled into the custom container →</Text>
              </Portal>
            )}
          </Box>
          <Box
            ref={(node) => {
              containerRef.current = node;
              if (node && !ready) setReady(true);
            }}
            p="md"
            style={{
              border: '1px solid var(--ds-color-border-focus)',
              background: 'var(--ds-color-surface-secondary)',
              flex: 1,
            }}
          >
            <Text weight="medium">Custom container</Text>
          </Box>
        </Box>
      );
    }
    return <Demo />;
  },
};
