import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Dialog.module.css';

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
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
 */
export function Dialog({
  open,
  defaultOpen = false,
  onOpenChange,
  title,
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
            aria-labelledby={titleId}
            className={mergeClasses(styles.panel, className)}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {children}
          </div>
        </div>
      )}
    </Portal>
  );
}
