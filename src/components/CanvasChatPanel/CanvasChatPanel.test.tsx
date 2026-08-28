import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import {
  CanvasChatPanel,
  buildCanvasChatPrompt,
  matchesCanvasChatShortcut,
} from './CanvasChatPanel';
import type { CanvasBlockData } from '../../utilities/canvasReducer';

const blocks: CanvasBlockData[] = [
  { id: 'b1', kind: 'sticky', text: 'Login flow', x: 0, y: 0, width: 100, height: 100 },
  { id: 'b2', kind: 'sticky', text: 'Auth service', x: 200, y: 0, width: 100, height: 100 },
];

describe('buildCanvasChatPrompt', () => {
  it('returns the prompt untouched with no selection', () => {
    expect(buildCanvasChatPrompt('tidy up', [])).toBe('tidy up');
  });

  it('embeds the full data of every selected block', () => {
    const result = buildCanvasChatPrompt('what is wrong here', [blocks[1]!]);
    expect(result).toContain('Selected elements (full content):');
    expect(result).toContain('"id":"b2"');
    expect(result).toContain('"text":"Auth service"');
  });
});

describe('matchesCanvasChatShortcut', () => {
  function keydown(init: Partial<KeyboardEvent> & { key: string }): KeyboardEvent {
    return new KeyboardEvent('keydown', { ...init, bubbles: true });
  }

  it("matches 'mod' against either Ctrl or Cmd", () => {
    expect(matchesCanvasChatShortcut(keydown({ key: 'j', ctrlKey: true }), 'mod+j')).toBe(true);
    expect(matchesCanvasChatShortcut(keydown({ key: 'j', metaKey: true }), 'mod+j')).toBe(true);
    expect(matchesCanvasChatShortcut(keydown({ key: 'j' }), 'mod+j')).toBe(false);
  });

  it('is case-insensitive on the key itself', () => {
    expect(matchesCanvasChatShortcut(keydown({ key: 'J', ctrlKey: true }), 'mod+j')).toBe(true);
  });

  it('requires every named modifier', () => {
    expect(matchesCanvasChatShortcut(keydown({ key: 'j', ctrlKey: true }), 'mod+shift+j')).toBe(
      false,
    );
    expect(
      matchesCanvasChatShortcut(
        keydown({ key: 'j', ctrlKey: true, shiftKey: true }),
        'mod+shift+j',
      ),
    ).toBe(true);
  });

  it('rejects a different key entirely', () => {
    expect(matchesCanvasChatShortcut(keydown({ key: 'k', ctrlKey: true }), 'mod+j')).toBe(false);
  });
});

describe('CanvasChatPanel', () => {
  it('submits the typed prompt through onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'add a note{Enter}');

    expect(onSubmit).toHaveBeenCalledWith('add a note');
  });

  it('folds the full selection into the submitted prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<CanvasChatPanel blocks={blocks} selectedBlocks={[blocks[0]!]} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'rewrite this{Enter}');

    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('"id":"b1"'));
  });

  it('names each selected block as its own chip, up to the chip limit', () => {
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[blocks[0]!, blocks[1]!]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText('Login flow')).toBeInTheDocument();
    expect(screen.getByText('Auth service')).toBeInTheDocument();
  });

  it('collapses the selection into a count once it overflows the chip limit', () => {
    const many: CanvasBlockData[] = Array.from({ length: 10 }, (_, index) => ({
      id: `n${index}`,
      kind: 'sticky',
      text: `Note ${index}`,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    }));

    render(<CanvasChatPanel blocks={blocks} selectedBlocks={many} onSubmit={vi.fn()} />);

    expect(screen.getByText('10 items selected')).toBeInTheDocument();
    expect(screen.queryByText('Note 0')).not.toBeInTheDocument();
  });

  it('shows the last submitted prompt above the reply, once one has been sent', async () => {
    const user = userEvent.setup();
    render(<CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />);

    expect(screen.queryByText('add a note')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'add a note{Enter}');

    expect(screen.getByText('add a note')).toBeInTheDocument();
  });

  it('shows the last reply as plain text', () => {
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        lastMessage="Added a note."
      />,
    );
    expect(screen.getByText('Added a note.')).toBeInTheDocument();
  });

  it("shows a compact, non-expandable account of the model's reasoning", () => {
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        lastMessage="Added a note."
        thinking="The board had no risks note yet."
      />,
    );
    expect(screen.getByText('Thinking')).toBeInTheDocument();
    expect(screen.getByText('The board had no risks note yet.')).toBeInTheDocument();
    // No accordion trigger, no way to reveal more than the one line shown.
    expect(screen.queryByRole('button', { name: /reasoning/i })).not.toBeInTheDocument();
  });

  it('renders nothing about reasoning when there is none to show', () => {
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        lastMessage="Added a note."
      />,
    );
    expect(screen.queryByText('Thinking')).not.toBeInTheDocument();
  });

  it('minimizes without unmounting the panel, offers no close control, and shows a title once minimized', async () => {
    const user = userEvent.setup();
    render(<CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Canvas Assistant')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Minimize canvas assistant' }));
    expect(screen.queryByLabelText('Ask or instruct the canvas')).not.toBeInTheDocument();
    expect(screen.getByText('Canvas Assistant')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand canvas assistant' }));
    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
    expect(screen.queryByText('Canvas Assistant')).not.toBeInTheDocument();
  });

  it('accepts a custom title, shown while minimized', async () => {
    const user = userEvent.setup();
    render(<CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} title="Ada" />);

    await user.click(screen.getByRole('button', { name: 'Minimize canvas assistant' }));
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('toggles minimized via a double-click on the drag handle', () => {
    const { container } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );
    const header = container.querySelector('[class*="header"]');
    expect(header).toBeTruthy();

    fireEvent.doubleClick(header as Element);
    expect(screen.queryByLabelText('Ask or instruct the canvas')).not.toBeInTheDocument();

    fireEvent.doubleClick(header as Element);
    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
  });

  it('never lets a press on it reach the canvas surface underneath', () => {
    const onSurfacePointerDown = vi.fn();
    const { container } = render(
      <div onPointerDown={onSurfacePointerDown}>
        <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />
      </div>,
    );

    const panel = container.querySelector('[class*="panel"]');
    fireEvent(
      panel as Element,
      new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }),
    );

    // Pressing the panel used to also bubble to the canvas surface, which
    // starts a marquee selection (or clears the current selection) there —
    // the panel now stops that at its own root.
    expect(onSurfacePointerDown).not.toHaveBeenCalled();
  });

  it('toggles minimized via the configured global shortcut, and registers no listener without one', () => {
    const { rerender } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );

    fireEvent.keyDown(document, { key: 'j', ctrlKey: true });
    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();

    rerender(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        minimizeShortcut="mod+j"
      />,
    );

    fireEvent.keyDown(document, { key: 'j', ctrlKey: true });
    expect(screen.queryByLabelText('Ask or instruct the canvas')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'j', ctrlKey: true });
    expect(screen.getByLabelText('Ask or instruct the canvas')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[blocks[0]!]}
        onSubmit={vi.fn()}
        lastMessage="Done."
        thinking="Two notes mention the same flow."
      />,
    );

    await expectNoA11yViolations(container);
  });
});
