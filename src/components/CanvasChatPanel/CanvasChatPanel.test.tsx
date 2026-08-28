import { describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
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

  it('appends a string context verbatim', () => {
    const result = buildCanvasChatPrompt('tidy up', [], 'The user is on the free plan.');
    expect(result).toContain('Additional context:');
    expect(result).toContain('The user is on the free plan.');
  });

  it('JSON-serializes a non-string context', () => {
    const result = buildCanvasChatPrompt('tidy up', [], { plan: 'pro', locale: 'en-GB' });
    expect(result).toContain('Additional context:');
    expect(result).toContain('"plan":"pro"');
  });

  it('omits the context section entirely when context is undefined', () => {
    const result = buildCanvasChatPrompt('tidy up', []);
    expect(result).not.toContain('Additional context:');
  });

  it('carries both the selection and the extra context in one prompt', () => {
    const result = buildCanvasChatPrompt('what is wrong here', [blocks[1]!], { plan: 'pro' });
    expect(result).toContain('Selected elements (full content):');
    expect(result).toContain('Additional context:');
    expect(result.indexOf('Selected elements')).toBeLessThan(result.indexOf('Additional context'));
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

/**
 * Simulates how `Canvas` actually drives the panel: each submit flips
 * `status` to `'loading'`, then resolves to a new `lastMessage`/`thinking`
 * pair — the same two-step update `useCanvasCommands` performs.
 */
function LiveChatPanel({
  blocks: liveBlocks,
  resolveRef,
}: {
  blocks: CanvasBlockData[];
  /** The test controls exactly when a reply "arrives" by calling this. */
  resolveRef?: { current: () => void };
}) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [lastMessage, setLastMessage] = useState<string | undefined>(undefined);
  const [thinking, setThinking] = useState<string | undefined>(undefined);
  const repliesRef = useRef(0);

  function resolve() {
    repliesRef.current += 1;
    setThinking(`Reasoning for reply ${repliesRef.current}`);
    setLastMessage(`Reply ${repliesRef.current}`);
    setStatus('done');
  }

  function handleSubmit() {
    setStatus('loading');
    if (resolveRef) {
      resolveRef.current = resolve;
    } else {
      resolve();
    }
  }

  return (
    <CanvasChatPanel
      blocks={liveBlocks}
      selectedBlocks={[]}
      onSubmit={handleSubmit}
      status={status}
      {...(lastMessage ? { lastMessage, thinking } : {})}
    />
  );
}

describe('CanvasChatPanel history', () => {
  it('keeps every past turn rather than replacing it with the newest', async () => {
    const user = userEvent.setup();
    render(<LiveChatPanel blocks={blocks} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'first ask{Enter}');
    await screen.findByText('Reply 1');

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'second ask{Enter}');
    await screen.findByText('Reply 2');

    expect(screen.getByText('first ask')).toBeInTheDocument();
    expect(screen.getByText('Reply 1')).toBeInTheDocument();
    expect(screen.getByText('second ask')).toBeInTheDocument();
    expect(screen.getByText('Reply 2')).toBeInTheDocument();
  });

  it('shows the typing indicator only while a reply is in flight, not once it has arrived', async () => {
    const user = userEvent.setup();
    const resolveRef = { current: () => {} };
    render(<LiveChatPanel blocks={blocks} resolveRef={resolveRef} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'ask{Enter}');
    expect(screen.getByRole('status', { name: 'Waiting for a reply' })).toBeInTheDocument();

    act(() => resolveRef.current());
    await screen.findByText('Reply 1');
    expect(screen.queryByRole('status', { name: 'Waiting for a reply' })).not.toBeInTheDocument();
  });

  it('keeps a completed turn\u2019s "Thinking" text static, not an ongoing animated indicator', async () => {
    const user = userEvent.setup();
    const resolveRef = { current: () => {} };
    render(<LiveChatPanel blocks={blocks} resolveRef={resolveRef} />);

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'ask{Enter}');
    act(() => resolveRef.current());
    await screen.findByText('Reply 1');

    expect(screen.getByText('Reasoning for reply 1')).toBeInTheDocument();
    // The only busy indicator left, if any, is the request-in-flight one —
    // and there is none once the reply has landed.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows a message already known on mount, without requiring a submit first', () => {
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        lastMessage="Restored from earlier."
      />,
    );
    expect(screen.getByText('Restored from earlier.')).toBeInTheDocument();
  });

  it('does not duplicate a message when the same lastMessage re-renders unchanged', () => {
    const { rerender } = render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        lastMessage="Added a note."
      />,
    );
    rerender(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={vi.fn()}
        disabled
        lastMessage="Added a note."
      />,
    );
    expect(screen.getAllByText('Added a note.')).toHaveLength(1);
  });
});

describe('CanvasChatPanel context', () => {
  it('folds a consumer-supplied context object into the submitted prompt', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <CanvasChatPanel
        blocks={blocks}
        selectedBlocks={[]}
        onSubmit={onSubmit}
        context={{ userPlan: 'pro' }}
      />,
    );

    await user.type(screen.getByLabelText('Ask or instruct the canvas'), 'summarize{Enter}');

    expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('"userPlan":"pro"'));
  });
});

describe('CanvasChatPanel resizing', () => {
  it('applies a pointer drag on the resize handle as a width/height change', () => {
    const { container } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );
    const panel = container.querySelector('[class*="panel"]') as HTMLElement;
    const handle = container.querySelector('[class*="resizeHandle"]') as HTMLElement;

    fireEvent(handle, new MouseEvent('pointerdown', { bubbles: true, clientX: 0, clientY: 0 }));
    fireEvent(handle, new MouseEvent('pointermove', { bubbles: true, clientX: 40, clientY: 20 }));
    fireEvent(handle, new MouseEvent('pointerup', { bubbles: true, clientX: 40, clientY: 20 }));

    expect(panel.style.width).not.toBe('');
    expect(panel.style.height).not.toBe('');
  });

  it('resizes via Alt+Arrow when the panel has focus, without requiring a pointer', () => {
    const { container } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );
    const panel = container.querySelector('[class*="panel"]') as HTMLElement;

    fireEvent.keyDown(panel, { key: 'ArrowRight', altKey: true });

    expect(panel.style.width).not.toBe('');
  });

  it('ignores arrow keys without Alt held, so typing/navigation elsewhere is unaffected', () => {
    const { container } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );
    const panel = container.querySelector('[class*="panel"]') as HTMLElement;

    fireEvent.keyDown(panel, { key: 'ArrowRight' });

    expect(panel.style.width).toBe('');
  });

  it('has no accessibility violations after resizing', async () => {
    const { container } = render(
      <CanvasChatPanel blocks={blocks} selectedBlocks={[]} onSubmit={vi.fn()} />,
    );
    const panel = container.querySelector('[class*="panel"]') as HTMLElement;
    fireEvent.keyDown(panel, { key: 'ArrowRight', altKey: true });

    await expectNoA11yViolations(container);
  });
});
