import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Calls `handler` on a pointerdown outside every element in `refs`, while
 * `active`. Accepts more than one ref so a trigger element can be excluded
 * alongside the panel it opens — e.g. Dropdown passes `[menuRef,
 * triggerRef]` so clicking the trigger itself (which has its own toggle
 * logic) isn't also treated as "outside".
 */
export function useClickOutside(
  refs: RefObject<Element | null> | RefObject<Element | null>[],
  handler: () => void,
  active = true,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const refList = Array.isArray(refs) ? refs : [refs];

  useEffect(() => {
    if (!active) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      const isInside = refList.some((ref) => ref.current?.contains(target));
      if (!isInside) {
        handlerRef.current();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refList is rebuilt each render, but its individual ref entries are stable, which is what the effect actually needs to depend on
  }, [active, ...refList]);
}
