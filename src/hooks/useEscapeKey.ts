import { useEffect, useRef } from 'react';

/** Calls `handler` on an Escape keydown anywhere in the document, while `active`. */
export function useEscapeKey(handler: () => void, active = true): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!active) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        handlerRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);
}
