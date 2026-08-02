import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

export interface PointerDragDelta {
  x: number;
  y: number;
}

export interface UsePointerDragOptions {
  onDragStart?: (event: ReactPointerEvent) => void;
  /** Called on every pointer move while dragging, with the cumulative `{x, y}` pixel delta (client coordinates) from where the drag started. */
  onDragMove?: (event: ReactPointerEvent, delta: PointerDragDelta) => void;
  onDragEnd?: (event: ReactPointerEvent) => void;
  disabled?: boolean;
}

export interface UsePointerDragHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerMove: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: (event: ReactPointerEvent) => void;
}

export interface UsePointerDragResult {
  isDragging: boolean;
  handlers: UsePointerDragHandlers;
}

/**
 * Unifies mouse + touch dragging on native Pointer Events, for later
 * drag-based controls (Slider, Range Slider, Resizable, Split Pane,
 * Carousel, Color Picker, Scroll Area's thumb, Pull To Refresh, Swipe
 * Actions — see docs/SPEC.md's Phase 4 notes). `onPointerDown` captures the
 * pointer via `setPointerCapture` so subsequent move/up events keep firing
 * on the same element even once the pointer leaves its bounds — no
 * document-level listeners needed. Spread `handlers` onto the draggable
 * element.
 *
 * `setPointerCapture`/`releasePointerCapture` aren't implemented in jsdom
 * (real-browser-only APIs, same class of gap as `usePositioning`'s
 * layout-engine dependency), so both calls are feature-detected — capture
 * is skipped rather than throwing, which still lets unit tests simulate a
 * drag by dispatching pointerdown/move/up directly on the element; a real
 * browser (via `pnpm test:storybook`) is what actually exercises capture
 * continuing to track the pointer once it leaves the element's bounds.
 *
 * `onDragMove` receives the cumulative delta in client-pixel coordinates —
 * converting that to a value range (e.g. a Slider mapping pixels to its
 * track width) is the consumer's job, not this hook's.
 */
export function usePointerDrag({
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled = false,
}: UsePointerDragOptions): UsePointerDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const originRef = useRef<PointerDragDelta>({ x: 0, y: 0 });

  function onPointerDown(event: ReactPointerEvent) {
    if (disabled) return;
    const target = event.currentTarget;
    if (typeof target.setPointerCapture === 'function') {
      target.setPointerCapture(event.pointerId);
    }
    originRef.current = { x: event.clientX, y: event.clientY };
    setIsDragging(true);
    onDragStart?.(event);
  }

  function onPointerMove(event: ReactPointerEvent) {
    if (!isDragging) return;
    const delta: PointerDragDelta = {
      x: event.clientX - originRef.current.x,
      y: event.clientY - originRef.current.y,
    };
    onDragMove?.(event, delta);
  }

  function endDrag(event: ReactPointerEvent) {
    if (!isDragging) return;
    const target = event.currentTarget;
    if (typeof target.releasePointerCapture === 'function') {
      target.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    onDragEnd?.(event);
  }

  return {
    isDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}
