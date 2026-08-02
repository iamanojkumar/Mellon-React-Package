import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Dialog.module.css';

export type DialogSize = 'sm' | 'md' | 'lg' | 'full';

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * Renders a simple `<h2>` and wires `aria-labelledby` to it — the quick
   * path for the common case. Omit it if you're building a custom heading
   * via `Dialog.Header` instead, and pass `aria-label` so the dialog still
   * has an accessible name.
   */
  title?: ReactNode;
  /** Accessible name, for when `title` is omitted (e.g. a custom `Dialog.Header`). Ignored if `title` is set. */
  'aria-label'?: string;
  size?: DialogSize;
  /** Shows a "×" button in the top-right corner that closes the dialog. Defaults to `true`. */
  showCloseButton?: boolean;
  /** Accessible label for the close button. Defaults to "Close". */
  closeLabel?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Not polymorphic — a dialog panel is a fixed structural pattern. Composes
 * `Portal` + `useFocusTrap` (used directly, not via the `<FocusTrap>`
 * wrapper component — Dialog already owns a panel ref for `role="dialog"`,
 * so wrapping would add a redundant `<div>`) + `useEscapeKey`. Renders
 * nothing when closed (no exit animation this pass). `Portal` stays
 * rendered regardless of `open` so its content mounts synchronously the
 * moment `open` flips true — see Portal.tsx for why that matters.
 *
 * `title` is optional (not required, as it originally was) now that
 * `Dialog.Header`/`Dialog.Body`/`Dialog.Footer` exist as an alternative,
 * more structured way to build the panel's content — those are purely
 * additive layout aids (border/spacing/alignment for a header, a
 * scrollable middle, a right-aligned footer), not a replacement API; the
 * simple `title`+`children` path still works exactly as before. The close
 * button is a root-level feature (not part of `Dialog.Header`) so it shows
 * up consistently whichever path a consumer uses.
 */
function DialogRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  title,
  'aria-label': ariaLabel,
  size = 'md',
  showCloseButton = true,
  closeLabel = 'Close',
  children,
  className,
}: DialogProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

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

  return (
    <Portal>
      {isOpen && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Escape (wired via useEscapeKey above) is the keyboard-accessible equivalent of clicking the backdrop to close
        <div className={styles.backdrop} onClick={() => setIsOpen(false)}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- purely a propagation guard so panel clicks don't bubble to the backdrop's close handler, not an interactive control itself */}
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={!title ? ariaLabel : undefined}
            data-size={size}
            className={mergeClasses(styles.panel, className)}
            onClick={(event) => event.stopPropagation()}
          >
            {showCloseButton && (
              <button
                type="button"
                className={styles.closeButton}
                aria-label={closeLabel}
                onClick={() => setIsOpen(false)}
              >
                ×
              </button>
            )}
            {title && (
              <h2 id={titleId} className={styles.title}>
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

export interface DialogPartProps {
  children?: ReactNode;
  className?: string;
}

/** Optional structural header — bottom border, spacing below. Sits above `Dialog.Body`/`children`; unrelated to the `title` prop, which renders its own `<h2>` separately. */
function DialogHeader({ children, className }: DialogPartProps) {
  return <div className={mergeClasses(styles.header, className)}>{children}</div>;
}

/** Optional scrollable middle section — takes up remaining panel height when used alongside `Dialog.Header`/`Dialog.Footer`. */
function DialogBody({ children, className }: DialogPartProps) {
  return <div className={mergeClasses(styles.body, className)}>{children}</div>;
}

/** Optional structural footer — top border, right-aligned flex row (the usual place for Cancel/Confirm buttons). */
function DialogFooter({ children, className }: DialogPartProps) {
  return <div className={mergeClasses(styles.footer, className)}>{children}</div>;
}

DialogRoot.displayName = 'Dialog';
DialogHeader.displayName = 'Dialog.Header';
DialogBody.displayName = 'Dialog.Body';
DialogFooter.displayName = 'Dialog.Footer';

/**
 * Compound component: `<Dialog><Dialog.Header>...</Dialog.Header><Dialog.Body>...</Dialog.Body><Dialog.Footer>...</Dialog.Footer></Dialog>`.
 * Parts are also individually named-exported — see docs/SPEC.md.
 */
export const Dialog = Object.assign(DialogRoot, {
  Header: DialogHeader,
  Body: DialogBody,
  Footer: DialogFooter,
  displayName: 'Dialog',
});

export { DialogHeader, DialogBody, DialogFooter };
