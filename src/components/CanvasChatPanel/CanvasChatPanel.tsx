import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { CanvasPromptBar } from '../CanvasPromptBar/CanvasPromptBar';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import type { MessageBubbleVariant } from '../MessageBubble/MessageBubble';
import { TypingIndicator } from '../TypingIndicator/TypingIndicator';
import { IconButton } from '../IconButton/IconButton';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import type { AIActionStatus } from '../../hooks/useAIAction';
import { canvasBlockLabel } from '../../utilities/canvasReducer';
import type { CanvasBlockData } from '../../utilities/canvasReducer';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './CanvasChatPanel.module.css';

export interface CanvasChatPanelProps {
  /** Every block, offered for `@` reference in the prompt field. */
  blocks: CanvasBlockData[];
  /** The canvas's current selection, full content — the panel's live context. */
  selectedBlocks: CanvasBlockData[];
  onSubmit: (prompt: string) => void;
  status?: AIActionStatus;
  error?: string;
  /** The most recent reply, shown as plain text. Appended to the chat history whenever it changes to a new value — omit once there's nothing new to show. */
  lastMessage?: string;
  lastMessageVariant?: MessageBubbleVariant;
  /**
   * The model's own brief account of why it answered or acted the way it
   * did, attached to that reply's own entry in the history. Shown as a
   * compact, non-expandable two-line summary above that reply — a
   * "Thinking" heading and one truncated line of the text itself, never the
   * full account. Omit once there's nothing to show.
   */
  thinking?: string;
  /**
   * Arbitrary extra context folded into every submitted prompt alongside the
   * current selection — anything the consuming app wants the model to see
   * that isn't canvas block data (the signed-in user, app-level state, a
   * page's own metadata, ...). A plain string is used verbatim; anything
   * else is JSON-serialized. Rebuilt fresh on every submit, so it always
   * reflects the app's current state at send time, not whatever it was when
   * the panel first mounted.
   */
  context?: unknown;
  disabled?: boolean;
  placeholder?: string;
  /** Header title shown only while minimized. Defaults to `'Canvas Assistant'`. */
  title?: string;
  /**
   * A key combo (e.g. `'mod+j'`) that toggles minimized/expanded from
   * anywhere in the document, regardless of what has focus — `'mod'`
   * matches Ctrl or Cmd. Left undefined by default: the panel registers no
   * global listener unless a host app explicitly opts in and picks the
   * chord itself.
   */
  minimizeShortcut?: string;
  /** Bounds the drag and resize stay inside — pass the canvas surface's own ref. */
  boundsRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Appends the selection's full data, and any consumer-supplied `context`, to
 * the prompt text rather than as separate fields — "what's wrong with these
 * three" needs the notes' actual content, not just which notes they are.
 * Rides inside the same string `useCanvasCommands.submit` already accepts,
 * so the command pipeline itself needed no changes for either.
 */
export function buildCanvasChatPrompt(
  prompt: string,
  selectedBlocks: CanvasBlockData[],
  context?: unknown,
): string {
  let result = prompt;

  if (selectedBlocks.length > 0) {
    const blockContext = selectedBlocks
      .map((block) => `${canvasBlockLabel(block)} (${block.id}): ${JSON.stringify(block)}`)
      .join('\n');
    result += `\n\nSelected elements (full content):\n${blockContext}`;
  }

  if (context !== undefined) {
    const contextText = typeof context === 'string' ? context : JSON.stringify(context);
    result += `\n\nAdditional context:\n${contextText}`;
  }

  return result;
}

/**
 * Matches a native `KeyboardEvent` against a `'mod+j'`-style chord string.
 * `'mod'` accepts either Ctrl or Cmd, so one shortcut string works across
 * platforms without the host app branching on OS. Unlisted modifiers are
 * not required but also not rejected — e.g. `'mod+j'` still matches with
 * Shift also held — which keeps the matcher small; a host wanting an exact
 * chord picks a more specific one (`'mod+shift+j'`).
 */
export function matchesCanvasChatShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut
    .toLowerCase()
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts[parts.length - 1];
  if (!key || event.key.toLowerCase() !== key) return false;

  const mods = parts.slice(0, -1);
  const modOk = mods.includes('mod') ? event.ctrlKey || event.metaKey : true;
  const ctrlOk = mods.includes('ctrl') ? event.ctrlKey : true;
  const metaOk = mods.includes('meta') || mods.includes('cmd') ? event.metaKey : true;
  const altOk = mods.includes('alt') || mods.includes('option') ? event.altKey : true;
  const shiftOk = mods.includes('shift') ? event.shiftKey : true;

  return modOk && ctrlOk && metaOk && altOk && shiftOk;
}

/** Pixels the pointer must travel before a press counts as a drag rather than a click — the same bargain `Canvas`'s own block-drag makes, and what lets a double-click land cleanly on the header instead of registering as two micro-drags. */
const DRAG_THRESHOLD = 3;

/** Selected blocks are named individually up to this many; past it, a single "N items selected" chip replaces the row rather than wrapping indefinitely. */
const MAX_SELECTION_CHIPS = 3;

const MIN_WIDTH = 260;
const MIN_HEIGHT = 220;
/** Keyboard resize step in pixels — Alt+Arrow; Shift for a bigger jump. */
const RESIZE_STEP = 12;
const RESIZE_STEP_LARGE = 32;

interface CanvasChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  variant?: MessageBubbleVariant;
  thinking?: string;
}

interface PanelSize {
  width: number;
  height: number;
}

/**
 * A floating chat surface over the canvas: a drag handle, a minimize toggle,
 * the full exchange so far (scrollable — new turns keep appending rather
 * than replacing the last one), and the prompt field. Never renders a close
 * affordance — an always-present control over the canvas is the point, so
 * the only state it offers is minimized/expanded, not mounted/unmounted.
 *
 * Draggable in screen space, not canvas space — it sits above `.world`, so
 * panning and zooming the scene underneath never moves it. Position and
 * history both reset on unmount by design; a panel remembering where it was
 * dragged, or what was said, across different scenes would be a surprise,
 * not a convenience.
 *
 * Resizable by dragging the corner handle, or Alt+Arrow keys (Shift for a
 * bigger step) while any focusable part of the panel has focus — the same
 * "pointer handle, keyboard equivalent needs no extra tab stop" shape
 * `Canvas`'s own block resize handles use. Clamped to `boundsRef` the same
 * way dragging is.
 *
 * Minimizing is a double-click on the header (mouse), the header's own
 * hover/focus-revealed icon button (keyboard and touch), or `minimizeShortcut`
 * (global, opt-in). Three paths to the same `setMinimized` toggle rather than
 * one, because a double-click alone is undiscoverable without a pointer and
 * a hover-revealed button alone is unreachable without one.
 */
export function CanvasChatPanel({
  blocks,
  selectedBlocks,
  onSubmit,
  status = 'idle',
  error,
  lastMessage,
  lastMessageVariant = 'ai',
  thinking,
  context,
  disabled = false,
  placeholder = 'Ask something',
  title = 'Canvas Assistant',
  minimizeShortcut,
  boundsRef,
  className,
}: CanvasChatPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState<PanelSize | undefined>(undefined);
  const [messages, setMessages] = useState<CanvasChatMessage[]>([]);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragBoundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(
    null,
  );
  const resizeOriginRef = useRef<PanelSize>({ width: 0, height: 0 });
  const resizeMaxRef = useRef<{ maxWidth: number; maxHeight: number } | null>(null);
  const movedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);
  // Tracks the last `lastMessage` text already turned into a history entry,
  // so a re-render with the same prop value (nothing new happened) doesn't
  // duplicate it — only an actual change to a new string appends.
  const appendedMessageRef = useRef<string | undefined>(undefined);

  function nextId(prefix: string) {
    return `${prefix}-${++idCounterRef.current}`;
  }

  function toggleMinimized() {
    setMinimized((value) => !value);
  }

  // Global and opt-in only: no listener at all unless a host app supplies a
  // chord, and it picks the chord — this never claims a key combo the host
  // didn't choose itself.
  useEffect(() => {
    if (!minimizeShortcut) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (!matchesCanvasChatShortcut(event, minimizeShortcut as string)) return;
      event.preventDefault();
      toggleMinimized();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [minimizeShortcut]);

  // Turns a new `lastMessage` into its own history entry the moment it
  // changes — including on first mount, so a consumer that already has a
  // reply in hand (e.g. restoring from its own state) can show it
  // immediately without faking a submit.
  useEffect(() => {
    if (lastMessage === undefined || lastMessage === appendedMessageRef.current) return;
    appendedMessageRef.current = lastMessage;
    setMessages((current) => [
      ...current,
      {
        id: nextId('assistant'),
        role: 'assistant',
        text: lastMessage,
        variant: lastMessageVariant,
        ...(thinking ? { thinking } : {}),
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessage]);

  // Keeps the newest turn in view — including the busy indicator while a
  // reply is in flight, so submitting doesn't leave the user staring at
  // whatever was previously at the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, status]);

  // Bounds are read once, at the start of a drag, rather than on every
  // pointermove — `getBoundingClientRect` forces a synchronous layout, and
  // calling it every frame of a drag is exactly what made the previous
  // version feel laggy. A resize mid-drag is the one case this misses, and
  // it self-corrects on the next drag.
  const { isDragging, handlers } = usePointerDrag({
    onDragStart: () => {
      dragOriginRef.current = offset;
      movedRef.current = false;
      const bounds = boundsRef?.current?.getBoundingClientRect();
      const panel = panelRef.current?.getBoundingClientRect();
      // Measured from the panel's actual on-screen rect rather than assumed
      // from its CSS anchor — the panel is inset from the surface's corner
      // by its own margin, not flush against it, so a clamp that assumed
      // "offset {0,0} = flush edge" let it drift outside the surface by
      // that margin (and any accumulated rounding) on every drag. `current`
      // rect already reflects any offset already applied, so it's
      // subtracted back out to find where offset {0,0} actually sits.
      dragBoundsRef.current =
        bounds && panel
          ? {
              minX: bounds.left - (panel.left - offset.x),
              maxX: bounds.right - panel.width - (panel.left - offset.x),
              minY: bounds.top - (panel.top - offset.y),
              maxY: bounds.bottom - panel.height - (panel.top - offset.y),
            }
          : null;
    },
    onDragMove: (_event, delta) => {
      if (!movedRef.current) {
        if (Math.abs(delta.x) < DRAG_THRESHOLD && Math.abs(delta.y) < DRAG_THRESHOLD) return;
        movedRef.current = true;
      }

      const next = { x: dragOriginRef.current.x + delta.x, y: dragOriginRef.current.y + delta.y };
      const bounds = dragBoundsRef.current;
      if (bounds) {
        next.x = Math.min(bounds.maxX, Math.max(bounds.minX, next.x));
        next.y = Math.min(bounds.maxY, Math.max(bounds.minY, next.y));
      }
      setOffset(next);
    },
  });

  function clampSize(width: number, height: number): PanelSize {
    const max = resizeMaxRef.current;
    return {
      width: Math.round(Math.max(MIN_WIDTH, max ? Math.min(width, max.maxWidth) : width)),
      height: Math.round(Math.max(MIN_HEIGHT, max ? Math.min(height, max.maxHeight) : height)),
    };
  }

  // Same "read bounds once, at the start of the gesture" bargain the drag
  // handlers make, for the same reason.
  const { isDragging: isResizing, handlers: resizeHandlers } = usePointerDrag({
    onDragStart: () => {
      const panel = panelRef.current?.getBoundingClientRect();
      resizeOriginRef.current = {
        width: panel?.width ?? MIN_WIDTH,
        height: panel?.height ?? MIN_HEIGHT,
      };
      const bounds = boundsRef?.current?.getBoundingClientRect();
      resizeMaxRef.current =
        bounds && panel
          ? { maxWidth: bounds.right - panel.left, maxHeight: bounds.bottom - panel.top }
          : null;
    },
    onDragMove: (_event, delta) => {
      setSize(
        clampSize(
          resizeOriginRef.current.width + delta.x,
          resizeOriginRef.current.height + delta.y,
        ),
      );
    },
  });

  function resizeBy(dWidth: number, dHeight: number) {
    const current = size ?? {
      width: panelRef.current?.getBoundingClientRect().width ?? MIN_WIDTH,
      height: panelRef.current?.getBoundingClientRect().height ?? MIN_HEIGHT,
    };
    const bounds = boundsRef?.current?.getBoundingClientRect();
    const panel = panelRef.current?.getBoundingClientRect();
    resizeMaxRef.current =
      bounds && panel
        ? { maxWidth: bounds.right - panel.left, maxHeight: bounds.bottom - panel.top }
        : null;
    setSize(clampSize(current.width + dWidth, current.height + dHeight));
  }

  // Alt+Arrow resizes, mirroring `Canvas`'s own Alt+arrows-resize-a-block
  // convention — reachable whenever focus is anywhere in the panel that
  // doesn't already claim arrow keys for itself (the prompt input stops its
  // own key events from bubbling this far, so this fires from the header's
  // toggle button, not while typing).
  function onPanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!event.altKey || minimized) return;
    const step = event.shiftKey ? RESIZE_STEP_LARGE : RESIZE_STEP;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      resizeBy(step, 0);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      resizeBy(-step, 0);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      resizeBy(0, step);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      resizeBy(0, -step);
    }
  }

  function handleSubmit(prompt: string) {
    setMessages((current) => [...current, { id: nextId('user'), role: 'user', text: prompt }]);
    onSubmit(buildCanvasChatPrompt(prompt, selectedBlocks, context));
  }

  const toggleLabel = minimized ? 'Expand canvas assistant' : 'Minimize canvas assistant';
  const busy = status === 'loading' || status === 'streaming';

  return (
    // The panel's own keydown handler only ever reads Alt+Arrow for resizing
    // (see `onPanelKeyDown`) — every other key passes through untouched, and
    // the focusable elements inside (the toggle button, the prompt input)
    // already carry their own semantics. Neither a11y rule below can model a
    // container whose only job is to intercept one specific chord.
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={panelRef}
      className={mergeClasses(styles.panel, className)}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        // Height only applies expanded — minimized collapses to the header
        // alone via CSS (`height: auto`), which an inline height would
        // otherwise override regardless of `data-minimized`.
        ...(size ? { width: size.width, ...(minimized ? {} : { height: size.height }) } : {}),
      }}
      data-minimized={minimized || undefined}
      data-dragging={isDragging || undefined}
      data-resizing={isResizing || undefined}
      // The panel sits inside the same surface the canvas reads pointerdown
      // on for marquee-select and click-to-deselect. Without this, pressing
      // anywhere on the panel — the header, the input, the toggle — also
      // bubbled up and started a marquee (or cleared the canvas selection)
      // underneath it.
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={onPanelKeyDown}
    >
      <div className={styles.header} {...handlers} onDoubleClick={toggleMinimized}>
        {minimized ? (
          <span className={styles.title}>{title}</span>
        ) : (
          <span className={styles.handleBar} aria-hidden="true" />
        )}
        <IconButton
          aria-label={toggleLabel}
          size="sm"
          variant="ghost"
          className={styles.toggle}
          onClick={toggleMinimized}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d={minimized ? 'M2.5 4.5L6 8L9.5 4.5' : 'M2.5 7.5L6 4L9.5 7.5'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>
      </div>

      {!minimized && (
        <div className={styles.body}>
          <div className={styles.scroll} ref={scrollRef}>
            {messages.map((message) =>
              message.role === 'user' ? (
                <MessageBubble key={message.id} variant="user" className={styles.turn}>
                  {message.text}
                </MessageBubble>
              ) : (
                <div key={message.id} className={styles.turn}>
                  {message.thinking && (
                    <div className={styles.thinking}>
                      <span className={styles.thinkingHeading}>Thinking</span>
                      <span className={styles.thinkingExcerpt}>{message.thinking}</span>
                    </div>
                  )}
                  <p
                    className={mergeClasses(
                      styles.response,
                      message.variant === 'error' && styles.responseError,
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              ),
            )}

            {busy && (
              <TypingIndicator size="sm" label="Waiting for a reply" className={styles.turn} />
            )}
          </div>

          <div className={styles.footer}>
            {selectedBlocks.length > 0 && (
              <div className={styles.selectionChips}>
                {selectedBlocks.length > MAX_SELECTION_CHIPS ? (
                  <span className={styles.contextBadge}>
                    {selectedBlocks.length} items selected
                  </span>
                ) : (
                  selectedBlocks.map((block) => (
                    <span key={block.id} className={styles.contextBadge}>
                      {canvasBlockLabel(block)}
                    </span>
                  ))
                )}
              </div>
            )}
            <CanvasPromptBar
              variant="minimal"
              blocks={blocks}
              onSubmit={handleSubmit}
              status={status}
              {...(error ? { error } : {})}
              disabled={disabled}
              placeholder={placeholder}
              className={styles.promptBar}
            />
          </div>

          {/* Pointer-only — Alt+Arrow (Shift for a bigger step) is the
              keyboard equivalent, the same split `Canvas`'s own resize
              handles use. */}
          <span
            className={styles.resizeHandle}
            aria-hidden="true"
            data-canvas-block-actions=""
            {...resizeHandlers}
          />
        </div>
      )}
    </div>
  );
}

CanvasChatPanel.displayName = 'CanvasChatPanel';
