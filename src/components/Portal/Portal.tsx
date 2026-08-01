import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export interface PortalProps {
  children?: ReactNode;
  /** DOM node (or a function returning one) to render into. Defaults to `document.body`. */
  container?: Element | (() => Element | null);
}

/**
 * Renders `children` into a different part of the DOM (default:
 * `document.body`) — the building block overlay components (Dialog,
 * Dropdown, Popover, Tooltip) render through.
 *
 * No `ref` prop: unlike other primitives, Portal has no DOM element of its
 * own to forward a ref to — it relocates `children`, it doesn't wrap them.
 *
 * Renders synchronously on the client rather than waiting a tick after
 * mount: `document.body` isn't part of what React hydrates at the root,
 * so a portal doesn't create a hydration mismatch by appearing on the
 * first client render. An earlier version of this component *did* wait a
 * tick (via `useState`/`useEffect`), on the assumption that was needed for
 * SSR safety — it wasn't, and it introduced a real race: a consumer's own
 * effect that depends on the portaled ref (Dialog's focus trap, Dropdown's
 * positioning) would run in the same commit, before that delayed second
 * render had created the node, and silently see `ref.current === null`.
 * The `typeof document` check alone is sufficient for SSR (renders `null`
 * server-side, where `document` doesn't exist).
 */
export function Portal({ children, container }: PortalProps) {
  if (typeof document === 'undefined') return null;

  const target = typeof container === 'function' ? container() : (container ?? document.body);
  if (!target) return null;

  return createPortal(children, target);
}
