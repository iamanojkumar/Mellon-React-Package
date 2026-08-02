import type { KeyboardEvent } from 'react';

export type RovingFocusOrientation = 'horizontal' | 'vertical' | 'both';

export interface UseRovingFocusOptions {
  /** CSS selector, scoped to the element this handler is attached to, identifying each focusable item — e.g. `'[role="tab"]:not(:disabled)'`. */
  itemSelector: string;
  /** Which arrow keys move focus: Left/Right, Up/Down, or (`'both'`) all four. */
  orientation: RovingFocusOrientation;
  /** Wrap from the last item back to the first (and vice versa). Defaults to `true`. */
  wrap?: boolean;
  /**
   * Called with the newly-focused item after any navigation (arrow keys,
   * Home, End). "Automatic activation" consumers use this to also select
   * the item as focus moves — e.g. `Tabs.List`. Omit it for "manual
   * activation" consumers where moving focus and selecting are separate
   * actions (Enter/Space/click) — e.g. a menu.
   */
  onNavigate?: (item: HTMLElement) => void;
}

/**
 * Generalizes the linear roving-tabindex keyboard nav (Arrow keys + Home/
 * End, wrapping, querying sibling items by selector and moving DOM focus)
 * that `Tabs.List` and `Dropdown.Menu` each currently hand-roll separately
 * — see docs/SPEC.md's Phase 4 notes. Returns an `onKeyDown` handler to
 * attach to the roving-tabindex container; each item is expected to manage
 * its own `tabIndex` (0 on the focused item, -1 on the rest) — this hook
 * only moves DOM focus and, via `onNavigate`, tells the caller which item
 * that was. It does not change any item's `tabIndex` itself, ARIA
 * attributes, or handle keys outside Arrow/Home/End (e.g. a menu closing
 * on Tab is caller-specific behavior, not part of this generalization).
 */
export function useRovingFocus({
  itemSelector,
  orientation,
  wrap = true,
  onNavigate,
}: UseRovingFocusOptions) {
  return function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(itemSelector));
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    const advanceKeys =
      orientation === 'vertical'
        ? ['ArrowDown']
        : orientation === 'horizontal'
          ? ['ArrowRight']
          : ['ArrowRight', 'ArrowDown'];
    const retreatKeys =
      orientation === 'vertical'
        ? ['ArrowUp']
        : orientation === 'horizontal'
          ? ['ArrowLeft']
          : ['ArrowLeft', 'ArrowUp'];

    let nextIndex: number;
    if (advanceKeys.includes(event.key)) {
      nextIndex = wrap
        ? (currentIndex + 1) % items.length
        : Math.min(currentIndex + 1, items.length - 1);
    } else if (retreatKeys.includes(event.key)) {
      nextIndex = wrap
        ? (currentIndex - 1 + items.length) % items.length
        : Math.max(currentIndex - 1, 0);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = items.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const next = items[nextIndex];
    if (!next) return;
    next.focus();
    onNavigate?.(next);
  };
}
