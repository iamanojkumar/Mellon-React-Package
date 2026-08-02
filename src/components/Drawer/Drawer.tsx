import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { mergeClasses } from '../../utilities/mergeClasses';
import { DialogHeader, DialogBody, DialogFooter } from '../Dialog/Dialog';
import dialogStyles from '../Dialog/Dialog.module.css';
import styles from './Drawer.module.css';

export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom';
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full';

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which edge the panel slides in from. Defaults to `'right'`. `'bottom'` is what covers "Bottom Sheet" (adds a draggable grabber for swipe-to-dismiss) — "Action Sheet" is just this with action-list content, no separate component. */
  placement?: DrawerPlacement;
  size?: DrawerSize;
  title?: ReactNode;
  /** Accessible name, for when `title` is omitted (e.g. a custom `Drawer.Header`). Ignored if `title` is set. */
  'aria-label'?: string;
  showCloseButton?: boolean;
  closeLabel?: string;
  children?: ReactNode;
  className?: string;
}

const DISMISS_THRESHOLD = 80;

/**
 * `Dialog`'s edge-anchored sibling — same overlay mechanics (`Portal`,
 * `useFocusTrap`, `useEscapeKey`, body-scroll lock, backdrop-click-to-
 * close), different panel shape and positioning. Reuses `Dialog`'s
 * `Header`/`Body`/`Footer` parts directly (`Drawer.Header` etc. are the
 * *same* components, not a re-implementation — they're generic
 * border/padding/alignment wrappers with nothing Dialog-specific in them)
 * and `Dialog.module.css`'s `.backdrop`, since an *absolutely positioned*
 * panel is unaffected by the backdrop's flex-centering rules made for
 * `Dialog`'s centered panel — only `.backdrop`'s padding needs overriding
 * (a drawer sits flush against the viewport edge), via the doubled-class
 * technique (`CLAUDE.md`) so the override wins regardless of import order.
 *
 * `placement="bottom"` gets a draggable grabber handle (`usePointerDrag`)
 * for swipe-to-dismiss — dragging it down past `DISMISS_THRESHOLD`px and
 * releasing closes the drawer, tracked via `setDragOffset`'s *functional*
 * updater form in `onDragEnd` (not the plain `dragOffset` closure value)
 * so the dismiss check always reads the latest drag position rather than
 * risking the same stale-closure class of bug documented for `OTPInput`
 * in Phase 12 — here the risk is `onDragEnd` firing with a value from
 * before the last `onDragMove`'s state update has committed.
 */
function DrawerRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  placement = 'right',
  size = 'md',
  title,
  'aria-label': ariaLabel,
  showCloseButton = true,
  closeLabel = 'Close',
  children,
  className,
}: DrawerProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [dragOffset, setDragOffset] = useState(0);
  // Mirrors `dragOffset`, updated synchronously — `onDragEnd` needs the
  // latest dragged distance to decide whether to dismiss, but reading it
  // via a functional `setDragOffset` updater (`setDragOffset((current) =>
  // ...)`) to get that value would mean calling `setIsOpen` *inside* that
  // updater, which React can invoke during its own render/reconciliation
  // work — an updater must stay a pure computation, and calling a second
  // component's setState from inside one produces exactly the "Cannot
  // update a component while rendering a different component" warning
  // this caused. A ref sidesteps both that and the stale-closure risk
  // (same class of bug as `OTPInput`'s in Phase 12) by letting `onDragEnd`
  // read the current value directly instead of through either an updater
  // or a stale render closure.
  const dragOffsetRef = useRef(0);

  useFocusTrap(panelRef, { active: isOpen });
  useEscapeKey(() => setIsOpen(false), isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      dragOffsetRef.current = 0;
      setDragOffset(0);
    }
  }, [isOpen]);

  const { handlers: grabberHandlers } = usePointerDrag({
    disabled: placement !== 'bottom',
    onDragMove: (_event, delta) => {
      if (delta.y > 0) {
        dragOffsetRef.current = delta.y;
        setDragOffset(delta.y);
      }
    },
    onDragEnd: () => {
      if (dragOffsetRef.current > DISMISS_THRESHOLD) setIsOpen(false);
      dragOffsetRef.current = 0;
      setDragOffset(0);
    },
  });

  return (
    <Portal>
      {isOpen && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape (wired via useEscapeKey above) is the keyboard-accessible equivalent of clicking the backdrop to close
        <div
          className={mergeClasses(dialogStyles.backdrop, styles.backdrop)}
          onClick={() => setIsOpen(false)}
        >
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- purely a propagation guard so panel clicks don't bubble to the backdrop's close handler, not an interactive control itself */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={!title ? ariaLabel : undefined}
            data-placement={placement}
            data-size={size}
            className={mergeClasses(styles.panel, className)}
            style={dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            {placement === 'bottom' && (
              <div className={styles.grabber} aria-hidden="true" {...grabberHandlers} />
            )}
            {showCloseButton && (
              <button
                type="button"
                className={dialogStyles.closeButton}
                aria-label={closeLabel}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            )}
            {title && (
              <h2 id={titleId} className={dialogStyles.title}>
                {title}
              </h2>
            )}
            {children}
          </div>
        </div>
      )}
    </Portal>
  );
}

DrawerRoot.displayName = 'Drawer';

/**
 * Compound component: `<Drawer><Drawer.Header>...</Drawer.Header><Drawer.Body>...</Drawer.Body><Drawer.Footer>...</Drawer.Footer></Drawer>`
 * — `Header`/`Body`/`Footer` are `Dialog`'s own parts, reused directly.
 */
export const Drawer = Object.assign(DrawerRoot, {
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  displayName: 'Drawer',
});
