import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ContextMenu } from './ContextMenu';
import { MenuItem } from '../Menu/Menu';

function BasicContextMenu(props: { disabled?: boolean; onSelect?: (item: string) => void }) {
  return (
    <ContextMenu
      disabled={props.disabled}
      menu={
        <>
          <MenuItem onSelect={() => props.onSelect?.('copy')}>Copy</MenuItem>
          <MenuItem onSelect={() => props.onSelect?.('paste')}>Paste</MenuItem>
          <MenuItem disabled onSelect={() => props.onSelect?.('delete')}>
            Delete
          </MenuItem>
        </>
      }
    >
      <div style={{ width: 200, height: 100 }}>Right-click me</div>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  it('is closed by default and has no menu in the document', () => {
    render(<BasicContextMenu />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the menu on right-click, focused on the first item', () => {
    render(<BasicContextMenu />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
  });

  it('does not open when disabled', () => {
    render(<BasicContextMenu disabled />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    render(<BasicContextMenu />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    // Lets `usePositioning`'s async `computePosition().then(setPosition)`
    // settle inside an act-wrapped call, rather than mid-flight during
    // axe's own async scan (which would log an act() warning).
    await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument());
    await expectNoA11yViolations(document.body);
  });

  it('selects an item, calls onSelect, and closes the menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicContextMenu onSelect={onSelect} />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    await user.click(screen.getByRole('menuitem', { name: 'Paste' }));
    expect(onSelect).toHaveBeenCalledWith('paste');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not select a disabled item, and the menu stays open', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicContextMenu onSelect={onSelect} />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<BasicContextMenu />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <BasicContextMenu />
        <button type="button">elsewhere</button>
      </div>,
    );
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('re-right-clicking while open repositions rather than closing', () => {
    render(<BasicContextMenu />);
    const target = screen.getByText('Right-click me');
    fireEvent.contextMenu(target, { clientX: 10, clientY: 10 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.contextMenu(target, { clientX: 80, clientY: 80 });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('allows navigating the menu with arrow keys', async () => {
    const user = userEvent.setup();
    render(<BasicContextMenu />);
    fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Paste' })).toHaveFocus();
  });

  describe('aiSuggest', () => {
    it('forwards aiSuggest to the internal Menu, rendering the AI trigger item', () => {
      render(
        <ContextMenu
          menu={<MenuItem onSelect={() => {}}>Copy</MenuItem>}
          aiSuggest={{ resolve: vi.fn() }}
        >
          <div style={{ width: 200, height: 100 }}>Right-click me</div>
        </ContextMenu>,
      );
      fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
      expect(screen.getByRole('menuitem', { name: 'Suggest with AI' })).toBeInTheDocument();
    });

    it('selecting a resolved AI item calls its onSelect and also closes the menu', async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      const resolve = vi.fn().mockResolvedValue([{ id: 'archive', label: 'Archive', onSelect }]);
      render(
        <ContextMenu menu={<MenuItem onSelect={() => {}}>Copy</MenuItem>} aiSuggest={{ resolve }}>
          <div style={{ width: 200, height: 100 }}>Right-click me</div>
        </ContextMenu>,
      );
      fireEvent.contextMenu(screen.getByText('Right-click me'), { clientX: 50, clientY: 50 });
      await user.click(screen.getByRole('menuitem', { name: 'Suggest with AI' }));
      await user.click(await screen.findByRole('menuitem', { name: 'Archive' }));
      expect(onSelect).toHaveBeenCalled();
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });
});
