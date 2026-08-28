import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
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
  /** The single most recent reply, shown as plain text. Omit once there's nothing to show yet. */
  lastMessage?: string;
  lastMessageVariant?: MessageBubbleVariant;
  /**
   * The model's own brief account of why it answered or acted the way it
   * did. Shown as a compact, non-expandable two-line summary above the
   * reply — a "Thinking" heading and one truncated line of the text itself,
   * never the full account. Omit once there's nothing to show.
   */
  thinking?: string;
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
  /** Bounds the drag stays inside — pass the canvas surface's own ref. */
  boundsRef?: RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * Appends the selection's full data to the prompt text, not just ids/labels —
 * "what's wrong with these three" needs the notes' actual content, not just
 * which notes they are. Rides inside the same string `useCanvasCommands.submit`
 * already accepts, so the command pipeline itself needed no changes.
 */
export function buildCanvasChatPrompt(prompt: string, selectedBlocks: CanvasBlockData[]): string {
  if (selectedBlocks.length === 0) return prompt;
  const context = selectedBlocks
    .map((block) => `${canvasBlockLabel(block)} (${block.id}): ${JSON.stringify(block)}`)
    .join('\n');
  return `${prompt}\n\nSelected elements (full content):\n${context}`;
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

/**
 * A floating chat surface over the canvas: a drag handle, a minimize toggle,
 * one visible exchange (the user's last prompt plus the reply), and the
 * prompt field. Never renders a close affordance — an always-present control
 * over the canvas is the point, so the only state it offers is
 * minimized/expanded, not mounted/unmounted.
 *
 * Draggable in screen space, not canvas space — it sits above `.world`, so
 * panning and zooming the scene underneath never moves it. Position resets on
 * unmount by design; a panel remembering where it was dragged across
 * different scenes would be a surprise, not a convenience.
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
  disabled = false,
  placeholder = 'Ask something',
  title = 'Canvas Assistant',
  minimizeShortcut,
  boundsRef,
  className,
}: CanvasChatPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [lastPrompt, setLastPrompt] = useState<string | undefined>(undefined);
  const dragOriginRef = useRef({ x: 0, y: 0 });
  const dragBoundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(
    null,
  );
  const movedRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  function handleSubmit(prompt: string) {
    setLastPrompt(prompt);
    onSubmit(buildCanvasChatPrompt(prompt, selectedBlocks));
  }

  const toggleLabel = minimized ? 'Expand canvas assistant' : 'Minimize canvas assistant';

  return (
    <div
      ref={panelRef}
      className={mergeClasses(styles.panel, className)}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      data-minimized={minimized || undefined}
      data-dragging={isDragging || undefined}
      // The panel sits inside the same surface the canvas reads pointerdown
      // on for marquee-select and click-to-deselect. Without this, pressing
      // anywhere on the panel — the header, the input, the toggle — also
      // bubbled up and started a marquee (or cleared the canvas selection)
      // underneath it.
      onPointerDown={(event) => event.stopPropagation()}
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
          <div className={styles.scroll}>
            {lastPrompt && (
              <MessageBubble variant="user" className={styles.turn}>
                {lastPrompt}
              </MessageBubble>
            )}

            {thinking && (
              <div className={styles.thinking}>
                <span className={styles.thinkingHeading}>
                  Thinking
                  <TypingIndicator size="sm" label="Thinking" className={styles.thinkingDots} />
                </span>
                <span className={styles.thinkingExcerpt}>{thinking}</span>
              </div>
            )}

            {lastMessage && (
              <p
                className={mergeClasses(
                  styles.response,
                  lastMessageVariant === 'error' && styles.responseError,
                )}
              >
                {lastMessage}
              </p>
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
        </div>
      )}
    </div>
  );
}

CanvasChatPanel.displayName = 'CanvasChatPanel';
