import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TreeView } from './TreeView';
import type { TreeViewNode } from './TreeView';

const nodes: TreeViewNode[] = [
  {
    id: 'fruits',
    label: 'Fruits',
    children: [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana', disabled: true },
    ],
  },
  {
    id: 'veggies',
    label: 'Vegetables',
    children: [{ id: 'carrot', label: 'Carrot' }],
  },
  { id: 'grains', label: 'Grains' },
];

function itemByName(name: string) {
  return screen.getByRole('treeitem', { name });
}

describe('TreeView', () => {
  it('renders a tree landmark labelled "Tree" by default', () => {
    render(<TreeView nodes={nodes} />);
    expect(screen.getByRole('tree', { name: 'Tree' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(<TreeView nodes={nodes} aria-label="Categories" />);
    expect(screen.getByRole('tree', { name: 'Categories' })).toBeInTheDocument();
  });

  it('sets aria-level/aria-setsize/aria-posinset on top-level items', () => {
    render(<TreeView nodes={nodes} />);
    const fruits = itemByName('Fruits');
    expect(fruits).toHaveAttribute('aria-level', '1');
    expect(fruits).toHaveAttribute('aria-setsize', '3');
    expect(fruits).toHaveAttribute('aria-posinset', '1');
    expect(itemByName('Grains')).toHaveAttribute('aria-posinset', '3');
  });

  it('marks branch items with aria-expanded and leaf items with neither', () => {
    render(<TreeView nodes={nodes} />);
    expect(itemByName('Fruits')).toHaveAttribute('aria-expanded', 'false');
    expect(itemByName('Grains')).not.toHaveAttribute('aria-expanded');
  });

  it('keeps children collapsed (not rendered) until expanded', () => {
    render(<TreeView nodes={nodes} />);
    expect(screen.queryByRole('treeitem', { name: 'Apple' })).not.toBeInTheDocument();
  });

  it('expands a branch when its twisty is clicked, revealing children', async () => {
    const user = userEvent.setup();
    render(<TreeView nodes={nodes} />);
    const twisty = within(itemByName('Fruits')).getByRole('button', { hidden: true });
    await user.click(twisty);
    expect(itemByName('Fruits')).toHaveAttribute('aria-expanded', 'true');
    expect(itemByName('Apple')).toBeInTheDocument();
  });

  it('clicking the twisty does not select the item', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<TreeView nodes={nodes} onSelectedChange={onSelectedChange} />);
    const twisty = within(itemByName('Fruits')).getByRole('button', { hidden: true });
    await user.click(twisty);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('clicking a row selects it and calls onSelectedChange', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(<TreeView nodes={nodes} onSelectedChange={onSelectedChange} />);
    await user.click(screen.getByText('Grains'));
    expect(onSelectedChange).toHaveBeenCalledWith('grains');
    expect(itemByName('Grains')).toHaveAttribute('aria-selected', 'true');
  });

  it('does not select a disabled item on click', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();
    render(
      <TreeView
        nodes={nodes}
        defaultExpandedIds={['fruits']}
        onSelectedChange={onSelectedChange}
      />,
    );
    await user.click(screen.getByText('Banana'));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  describe('keyboard navigation', () => {
    it('ArrowDown/ArrowUp move focus through visible items only', async () => {
      const user = userEvent.setup();
      render(<TreeView nodes={nodes} />);
      act(() => {
        itemByName('Fruits').focus();
      });

      // Fruits is collapsed, so ArrowDown skips its (invisible) children
      await user.keyboard('{ArrowDown}');
      expect(itemByName('Vegetables')).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(itemByName('Grains')).toHaveFocus();

      await user.keyboard('{ArrowUp}');
      expect(itemByName('Vegetables')).toHaveFocus();
    });

    it('ArrowRight expands a collapsed branch without moving focus, then moves into it', async () => {
      const user = userEvent.setup();
      render(<TreeView nodes={nodes} />);
      act(() => {
        itemByName('Fruits').focus();
      });

      await user.keyboard('{ArrowRight}');
      expect(itemByName('Fruits')).toHaveAttribute('aria-expanded', 'true');
      expect(itemByName('Fruits')).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(itemByName('Apple')).toHaveFocus();
    });

    it('ArrowLeft collapses an expanded branch, then moves to the parent', async () => {
      const user = userEvent.setup();
      render(<TreeView nodes={nodes} defaultExpandedIds={['fruits']} />);
      act(() => {
        itemByName('Apple').focus();
      });

      await user.keyboard('{ArrowLeft}');
      expect(itemByName('Fruits')).toHaveFocus();

      await user.keyboard('{ArrowLeft}');
      expect(itemByName('Fruits')).toHaveAttribute('aria-expanded', 'false');
    });

    it('Home/End jump to the first/last visible item', async () => {
      const user = userEvent.setup();
      render(<TreeView nodes={nodes} defaultExpandedIds={['fruits', 'veggies']} />);
      act(() => {
        itemByName('Apple').focus();
      });

      await user.keyboard('{End}');
      expect(itemByName('Grains')).toHaveFocus();

      await user.keyboard('{Home}');
      expect(itemByName('Fruits')).toHaveFocus();
    });

    it('Enter/Space selects the focused item', async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(<TreeView nodes={nodes} onSelectedChange={onSelectedChange} />);
      act(() => {
        itemByName('Vegetables').focus();
      });

      await user.keyboard('{Enter}');
      expect(onSelectedChange).toHaveBeenCalledWith('veggies');
    });

    it('does not select a disabled item via Enter', async () => {
      const user = userEvent.setup();
      const onSelectedChange = vi.fn();
      render(
        <TreeView
          nodes={nodes}
          defaultExpandedIds={['fruits']}
          onSelectedChange={onSelectedChange}
        />,
      );
      act(() => {
        itemByName('Banana').focus();
      });
      await user.keyboard('{Enter}');
      expect(onSelectedChange).not.toHaveBeenCalled();
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TreeView nodes={nodes} defaultExpandedIds={['fruits']} />);
    await expectNoA11yViolations(container);
  });
});
