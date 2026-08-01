import { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface FocusTrapProps {
  active: boolean;
  /** Focused first when the trap activates. Defaults to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/**
 * Declarative wrapper around `useFocusTrap` for consumers building custom
 * overlays who'd rather not manage their own container ref. `Dialog` uses
 * `useFocusTrap` directly instead of this (it already owns a panel ref for
 * `role="dialog"`, so wrapping it here would just add a redundant `<div>`).
 */
export function FocusTrap({ active, initialFocusRef, children }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, { active, initialFocusRef });
  return <div ref={containerRef}>{children}</div>;
}
