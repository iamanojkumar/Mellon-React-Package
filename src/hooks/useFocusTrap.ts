import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

export interface UseFocusTrapOptions {
  active: boolean;
  /** Focused first when the trap activates. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Traps Tab/Shift+Tab cycling within `containerRef` while `active`, and
 * restores focus to whatever was focused before on deactivate. Doesn't
 * filter for visibility (e.g. `offsetParent`) — jsdom has no layout engine
 * so that check would be untestable, and the real use cases (Dialog,
 * Dropdown) never hide focusable content within an open trap anyway.
 */
export function useFocusTrap<T extends HTMLElement>(
  containerRef: RefObject<T | null>,
  { active, initialFocusRef }: UseFocusTrapOptions,
): void {
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const initial = initialFocusRef?.current ?? getFocusableElements(container)[0];
    initial?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusableElements(container);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const current = document.activeElement;

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !container.contains(current)) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        getFocusableElements(container)[0]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);
      previouslyFocused.current?.focus();
    };
  }, [active, containerRef, initialFocusRef]);
}
