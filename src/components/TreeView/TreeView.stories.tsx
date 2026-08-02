import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TreeView } from './TreeView';
import type { TreeViewNode } from './TreeView';
import { Text } from '../Text/Text';

const fileTree: TreeViewNode[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'button', label: 'Button.tsx' },
          { id: 'card', label: 'Card.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  {
    id: 'docs',
    label: 'docs',
    children: [{ id: 'spec', label: 'SPEC.md' }],
  },
  { id: 'readme', label: 'README.md' },
  { id: 'lockfile', label: 'pnpm-lock.yaml', disabled: true },
];

const meta: Meta<typeof TreeView> = {
  title: 'Navigation/TreeView',
  component: TreeView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TreeView>;

export const Default: Story = {
  render: () => <TreeView nodes={fileTree} aria-label="Project files" />,
};

export const ExpandedByDefault: Story = {
  render: () => (
    <TreeView
      nodes={fileTree}
      aria-label="Project files"
      defaultExpandedIds={['src', 'components']}
    />
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <TreeView nodes={fileTree} aria-label="Project files" defaultExpandedIds={['src']} />
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 220 }}>
      <TreeView nodes={fileTree} aria-label="Project files" defaultExpandedIds={['src']} />
    </div>
  ),
};

/**
 * Tab to an item, then ArrowDown/ArrowUp to move between visible items,
 * ArrowRight to expand a branch (or move into it once expanded), ArrowLeft
 * to collapse a branch (or move to its parent once collapsed), Home/End to
 * jump to the first/last visible item, and Enter/Space to select the
 * focused item.
 */
export const KeyboardNavigation: Story = {
  render: () => <TreeView nodes={fileTree} aria-label="Project files" />,
};

export const Accessibility: Story = {
  render: () => (
    <TreeView nodes={fileTree} aria-label="Project files" defaultExpandedIds={['src']} />
  ),
};

export const Controlled: Story = {
  render: function ControlledTreeView() {
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [expandedIds, setExpandedIds] = useState<string[]>(['src']);
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          Selected: {selectedId ?? 'none'}
        </Text>
        <TreeView
          nodes={fileTree}
          aria-label="Project files"
          selectedId={selectedId}
          onSelectedChange={setSelectedId}
          expandedIds={expandedIds}
          onExpandedChange={setExpandedIds}
        />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <TreeView
      nodes={fileTree}
      aria-label="Project files"
      defaultSelectedId="readme"
      defaultExpandedIds={['src']}
    />
  ),
};
