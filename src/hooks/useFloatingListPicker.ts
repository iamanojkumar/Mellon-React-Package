import { useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { ForwardedRef, RefObject } from 'react';
import { usePositioning } from './usePositioning';
import type { Position } from './usePositioning';
import { useClickOutside } from './useClickOutside';
import { useEscapeKey } from './useEscapeKey';

export interface FloatingListPickerItem {
  disabled?: boolean;
}

/** A minimal, framework-agnostic keyboard-event shape — just enough to read `key` and call `preventDefault`, so a real host-input `KeyboardEvent` (React or native) satisfies it without importing React's event types here. */
export interface FloatingListPickerKeyEvent {
  key: string;
  preventDefault: () => void;
}

export interface FloatingListPickerHandle {
  /**
   * Call this from the host input's own `onKeyDown` for every keystroke —
   * returns `true` when the key was consumed (Arrow/Enter/Tab/Escape while
   * open), so the caller knows whether to skip its own default handling
   * for that key.
   */
  handleKeyDown: (event: FloatingListPickerKeyEvent) => boolean;
}

export interface UseFloatingListPickerOptions<T extends FloatingListPickerItem> {
  open: boolean;
  /** Viewport point to anchor the panel at — typically the host input's caret position, computed by the consumer (this hook does not measure caret position itself). */
  anchorPoint: { x: number; y: number };
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  forwardedRef: ForwardedRef<FloatingListPickerHandle>;
}

export interface UseFloatingListPickerResult {
  activeIndex: number;
  position: Position;
}

function enabledIndices<T extends FloatingListPickerItem>(items: T[]): number[] {
  return items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index);
    return acc;
  }, []);
}

/**
 * Shared logic behind `MentionPicker`/`SlashCommandPicker`: both are a
 * small list floated at an arbitrary viewport point (a host `TextArea`'s
 * caret, not a trigger element `usePositioning`'s ref-based path expects)
 * — the same virtual-element positioning trick `ContextMenu` established
 * for click-point placement, generalized here the same way `useRovingFocus`
 * generalized the roving-tabindex logic `Tabs`/`Dropdown` used to each
 * hand-roll separately (see `docs/SPEC.md`'s Phase 4 notes).
 *
 * Real DOM focus can't move into the panel — moving it would defocus the
 * host `TextArea` the user is still typing in — so this can't reuse
 * `useRovingFocus` (which moves real focus) or listen to keydown itself.
 * Instead it exposes `handleKeyDown` via `useImperativeHandle`: the
 * consumer's own `TextArea` keydown handler must call it and act on the
 * returned boolean, the same "expose an imperative handle for a caller who
 * owns the real event" shape as a native `<video>` ref, just for keyboard
 * routing instead of playback control.
 */
export function useFloatingListPicker<T extends FloatingListPickerItem>({
  open,
  anchorPoint,
  items,
  onSelect,
  onClose,
  panelRef,
  forwardedRef,
}: UseFloatingListPickerOptions<T>): UseFloatingListPickerResult {
  const [activeIndex, setActiveIndex] = useState(0);

  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect: () => new DOMRect(anchorPoint.x, anchorPoint.y, 0, 0),
    }),
    [anchorPoint.x, anchorPoint.y],
  );

  const position = usePositioning(virtualReference, panelRef, {
    active: open,
    placement: 'bottom-start',
  });

  useEscapeKey(onClose, open);
  useClickOutside([panelRef], onClose, open);

  useEffect(() => {
    setActiveIndex(0);
  }, [open, items]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      handleKeyDown(event) {
        if (!open) return false;
        const indices = enabledIndices(items);
        if (indices.length === 0) return false;

        switch (event.key) {
          case 'ArrowDown': {
            event.preventDefault();
            const position = indices.indexOf(activeIndex);
            setActiveIndex(indices[(position + 1) % indices.length]!);
            return true;
          }
          case 'ArrowUp': {
            event.preventDefault();
            const position = indices.indexOf(activeIndex);
            setActiveIndex(indices[(position - 1 + indices.length) % indices.length]!);
            return true;
          }
          case 'Enter':
          case 'Tab': {
            const item = items[activeIndex];
            if (!item || item.disabled) return false;
            event.preventDefault();
            onSelect(item);
            return true;
          }
          case 'Escape':
            event.preventDefault();
            onClose();
            return true;
          default:
            return false;
        }
      },
    }),
    [open, items, activeIndex, onSelect, onClose],
  );

  return { activeIndex, position };
}
