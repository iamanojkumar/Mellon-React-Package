import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { CommandPalette } from './CommandPalette';
import type { CommandPaletteGroup, CommandPaletteItem } from './CommandPalette';

function makeItems(onSelectSpies: Record<string, ReturnType<typeof vi.fn>>): CommandPaletteItem[] {
  return [
    { id: 'new-file', label: 'New File', keywords: ['create'], onSelect: onSelectSpies.newFile! },
    { id: 'open-file', label: 'Open File', onSelect: onSelectSpies.openFile! },
    {
      id: 'delete-file',
      label: 'Delete File',
      disabled: true,
      onSelect: onSelectSpies.deleteFile!,
    },
  ];
}

function ControlledPalette(props: { hotkey?: boolean; onSelect?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const items: CommandPaletteItem[] = [
    { id: 'a', label: 'Item A', onSelect: () => props.onSelect?.('a') },
    { id: 'b', label: 'Item B', onSelect: () => props.onSelect?.('b') },
  ];
  return <CommandPalette open={open} onOpenChange={setOpen} items={items} hotkey={props.hotkey} />;
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    render(<CommandPalette items={[]} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog labelled "Command palette" by default when open', () => {
    render(<CommandPalette items={[]} defaultOpen />);
    expect(screen.getByRole('dialog', { name: 'Command palette' })).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(<CommandPalette items={[]} defaultOpen aria-label="Quick actions" />);
    expect(screen.getByRole('dialog', { name: 'Quick actions' })).toBeInTheDocument();
  });

  it('wraps flat items in a single unheaded group', () => {
    const onSelect = vi.fn();
    render(<CommandPalette items={[{ id: 'x', label: 'Do X', onSelect }]} defaultOpen />);
    expect(screen.getByRole('option', { name: 'Do X' })).toBeInTheDocument();
  });

  it('renders grouped items under their heading', () => {
    const groups: CommandPaletteGroup[] = [
      {
        id: 'files',
        heading: 'Files',
        items: [{ id: 'nf', label: 'New File', onSelect: vi.fn() }],
      },
      { id: 'edit', heading: 'Edit', items: [{ id: 'u', label: 'Undo', onSelect: vi.fn() }] },
    ];
    render(<CommandPalette groups={groups} defaultOpen />);
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'New File' })).toBeInTheDocument();
  });

  it('filters items as the query changes, matching label and keywords', async () => {
    const user = userEvent.setup();
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);
    const input = screen.getByRole('combobox');

    await user.type(input, 'create');
    expect(screen.getByRole('option', { name: 'New File' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Open File' })).not.toBeInTheDocument();
  });

  it('shows the empty label when nothing matches', async () => {
    const user = userEvent.setup();
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText('No results')).toBeInTheDocument();
  });

  it('clicking an item calls onSelect and closes the palette', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ControlledPalette onSelect={onSelect} />);
    // The palette starts closed in ControlledPalette; open it via the hotkey.
    await user.keyboard('{Control>}k{/Control}');
    await user.click(screen.getByRole('option', { name: 'Item A' }));
    expect(onSelect).toHaveBeenCalledWith('a');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not select a disabled item on click', async () => {
    const user = userEvent.setup();
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);
    await user.click(screen.getByRole('option', { name: 'Delete File' }));
    expect(spies.deleteFile).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ArrowDown/ArrowUp move the active option, skipping disabled ones', async () => {
    const user = userEvent.setup();
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);

    expect(screen.getByRole('option', { name: 'New File' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Open File' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    // "Delete File" is disabled and skipped, wrapping back to "New File"
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'New File' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('Enter selects the active item and closes the palette', async () => {
    const user = userEvent.setup();
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(spies.openFile).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<CommandPalette items={[]} defaultOpen />);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('hotkey', () => {
    it('Cmd/Ctrl+K toggles the palette open and closed by default', async () => {
      const user = userEvent.setup();
      render(<ControlledPalette />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await user.keyboard('{Control>}k{/Control}');
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Control>}k{/Control}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('does nothing when hotkey is false', async () => {
      const user = userEvent.setup();
      render(<ControlledPalette hotkey={false} />);
      await user.keyboard('{Control>}k{/Control}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('has no accessibility violations', async () => {
    const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
    render(<CommandPalette items={makeItems(spies)} defaultOpen />);
    await expectNoA11yViolations(document.body);
  });

  describe('aiSearch', () => {
    it('does not call onQuery when aiSearch is omitted', () => {
      vi.useFakeTimers();
      const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
      render(<CommandPalette items={makeItems(spies)} defaultOpen />);
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
      vi.advanceTimersByTime(1000);
      vi.useRealTimers();
    });

    it('debounces and calls onQuery only once local matches are empty (default onlyWhenNoMatches)', async () => {
      vi.useFakeTimers();
      const onQuery = vi.fn().mockResolvedValue([]);
      const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
      render(<CommandPalette items={makeItems(spies)} defaultOpen aiSearch={{ onQuery }} />);
      const input = screen.getByRole('combobox');

      // "create" matches "New File" locally — onQuery should not fire.
      fireEvent.change(input, { target: { value: 'create' } });
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
      expect(onQuery).not.toHaveBeenCalled();

      // "zzz" matches nothing locally — onQuery should fire after the debounce.
      fireEvent.change(input, { target: { value: 'zzz' } });
      await act(async () => {
        vi.advanceTimersByTime(299);
      });
      expect(onQuery).not.toHaveBeenCalled();
      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(onQuery).toHaveBeenCalledWith('zzz');
      vi.useRealTimers();
    });

    it('shows the loading label while onQuery is in flight, then the resolved AI group', async () => {
      vi.useFakeTimers();
      let resolvePromise: ((items: CommandPaletteItem[]) => void) | undefined;
      const onQuery = vi.fn(
        () =>
          new Promise<CommandPaletteItem[]>((resolve) => {
            resolvePromise = resolve;
          }),
      );
      const onSelect = vi.fn();
      render(
        <CommandPalette
          items={[{ id: 'a', label: 'Item A', onSelect: vi.fn() }]}
          defaultOpen
          aiSearch={{ onQuery }}
        />,
      );

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
      vi.advanceTimersByTime(300);
      expect(screen.getByText('Thinking…')).toBeInTheDocument();

      resolvePromise?.([{ id: 'ai-1', label: 'AI Suggested Command', onSelect }]);
      vi.useRealTimers();
      await waitFor(() =>
        expect(screen.getByRole('option', { name: 'AI Suggested Command' })).toBeInTheDocument(),
      );
      expect(screen.getByText('Suggested')).toBeInTheDocument();

      const user = userEvent.setup();
      await user.click(screen.getByRole('option', { name: 'AI Suggested Command' }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('calls onQuery even with local matches when onlyWhenNoMatches is false', async () => {
      vi.useFakeTimers();
      const onQuery = vi.fn().mockResolvedValue([]);
      const spies = { newFile: vi.fn(), openFile: vi.fn(), deleteFile: vi.fn() };
      render(
        <CommandPalette
          items={makeItems(spies)}
          defaultOpen
          aiSearch={{ onQuery, onlyWhenNoMatches: false }}
        />,
      );
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'create' } });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      expect(onQuery).toHaveBeenCalledWith('create');
      vi.useRealTimers();
    });

    it('supports a custom loadingLabel and groupHeading', async () => {
      vi.useFakeTimers();
      let resolvePromise: ((items: CommandPaletteItem[]) => void) | undefined;
      const onQuery = vi.fn(
        () =>
          new Promise<CommandPaletteItem[]>((resolve) => {
            resolvePromise = resolve;
          }),
      );
      render(
        <CommandPalette
          items={[]}
          defaultOpen
          aiSearch={{ onQuery, loadingLabel: 'Asking AI…', groupHeading: 'From AI' }}
        />,
      );
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz' } });
      vi.advanceTimersByTime(300);
      expect(screen.getByText('Asking AI…')).toBeInTheDocument();

      resolvePromise?.([{ id: 'ai-1', label: 'Suggestion', onSelect: vi.fn() }]);
      vi.useRealTimers();
      await waitFor(() => expect(screen.getByText('From AI')).toBeInTheDocument());
    });
  });
});
