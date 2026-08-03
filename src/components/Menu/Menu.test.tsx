import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Menu, MenuItem } from './Menu';

function BasicMenu(props: { onSelect?: (item: string) => void }) {
  return (
    <Menu aria-label="Actions">
      <MenuItem onSelect={() => props.onSelect?.('edit')}>Edit</MenuItem>
      <MenuItem onSelect={() => props.onSelect?.('duplicate')}>Duplicate</MenuItem>
      <MenuItem disabled onSelect={() => props.onSelect?.('delete')}>
        Delete
      </MenuItem>
    </Menu>
  );
}

describe('Menu', () => {
  it('renders role="menu" with role="menuitem" children', () => {
    render(<BasicMenu />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicMenu />);
    await expectNoA11yViolations(container);
  });

  it('only the first item is a tab stop initially', () => {
    render(<BasicMenu />);
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('tabIndex', '-1');
  });

  it('does not auto-focus any item on mount', () => {
    render(<BasicMenu />);
    expect(screen.getByRole('menuitem', { name: 'Edit' })).not.toHaveFocus();
  });

  it('moves the roving tab stop with ArrowDown/ArrowUp, skipping disabled items, and wraps', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    screen.getByRole('menuitem', { name: 'Edit' }).focus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('tabIndex', '0');

    // "Delete" is disabled and excluded, so ArrowDown wraps back to "Edit"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('selects an item on click, calling onSelect', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onSelect).toHaveBeenCalledWith('duplicate');
  });

  it('selects the focused item with Enter/Space', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    screen.getByRole('menuitem', { name: 'Edit' }).focus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('edit');
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('does not select a disabled item on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicMenu onSelect={onSelect} />);
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking an item moves the roving tab stop to it', async () => {
    const user = userEvent.setup();
    render(<BasicMenu />);
    await user.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('tabIndex', '0');
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('tabIndex', '-1');
  });

  describe('aiSuggest', () => {
    it('renders no AI trigger item when aiSuggest is omitted', () => {
      render(<BasicMenu />);
      expect(screen.queryByRole('menuitem', { name: /Suggest with AI/ })).not.toBeInTheDocument();
    });

    it('renders an AI trigger item when aiSuggest is passed', () => {
      render(
        <Menu aria-label="Actions" aiSuggest={{ resolve: vi.fn() }}>
          <MenuItem onSelect={() => {}}>Edit</MenuItem>
        </Menu>,
      );
      expect(screen.getAllByRole('menuitem')).toHaveLength(2);
      expect(screen.getByRole('menuitem', { name: 'Suggest with AI' })).toBeInTheDocument();
    });

    it('resolved items are merged in as real, clickable menu items under a Suggested heading', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const resolve = vi.fn().mockResolvedValue([{ id: 'archive', label: 'Archive', onSelect }]);
      render(
        <Menu aria-label="Actions" aiSuggest={{ resolve }}>
          <MenuItem onSelect={() => {}}>Edit</MenuItem>
        </Menu>,
      );
      await user.click(screen.getByRole('menuitem', { name: 'Suggest with AI' }));
      expect(resolve).toHaveBeenCalled();
      expect(await screen.findByText('Suggested')).toBeInTheDocument();
      await user.click(screen.getByRole('menuitem', { name: 'Archive' }));
      expect(onSelect).toHaveBeenCalled();
    });

    it('the AI trigger item participates in roving-tabindex keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <Menu aria-label="Actions" aiSuggest={{ resolve: vi.fn() }}>
          <MenuItem onSelect={() => {}}>Edit</MenuItem>
        </Menu>,
      );
      screen.getByRole('menuitem', { name: 'Edit' }).focus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('menuitem', { name: 'Suggest with AI' })).toHaveFocus();
    });

    it('shows an inline error when resolve rejects', async () => {
      const user = userEvent.setup();
      const resolve = vi.fn().mockRejectedValue(new Error('nope'));
      render(
        <Menu aria-label="Actions" aiSuggest={{ resolve }}>
          <MenuItem onSelect={() => {}}>Edit</MenuItem>
        </Menu>,
      );
      await user.click(screen.getByRole('menuitem', { name: 'Suggest with AI' }));
      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't get suggestions.");
    });

    it('has no accessibility violations with the AI trigger item rendered', async () => {
      const { container } = render(
        <Menu aria-label="Actions" aiSuggest={{ resolve: vi.fn() }}>
          <MenuItem onSelect={() => {}}>Edit</MenuItem>
        </Menu>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
