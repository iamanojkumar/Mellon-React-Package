import { useEffect, useRef } from 'react';
import type { ToastRecord } from '../../contexts/ToastContext';
import { AlertVariantIcon } from '../Alert/Alert';
import styles from './Toast.module.css';

export interface ToastItemProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
}

/**
 * Internal — not exported from `src/components/index.ts`. Consumers reach
 * toasts only through `useToast()`/`ToastProvider`, never by rendering
 * this directly (same reasoning `DialogHeader` etc. *are* exported: those
 * are meant to be composed by consumers, this isn't).
 *
 * `setTimeout`-based auto-dismiss rather than `usePointerDrag` (nothing to
 * drag here) — `onDismiss` is captured in a ref so the effect's timer
 * doesn't need `onDismiss` in its dependency array (it's a stable
 * `useCallback` from `ToastProvider` already, but the ref keeps this
 * resilient regardless), and so the timer isn't torn down/recreated on
 * every parent re-render.
 */
export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!toast.duration || !Number.isFinite(toast.duration)) return;
    const timer = window.setTimeout(() => {
      onDismissRef.current(toast.id);
    }, toast.duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.duration]);

  return (
    <div
      role={toast.variant === 'warning' || toast.variant === 'danger' ? 'alert' : 'status'}
      className={styles.toast}
      data-variant={toast.variant}
    >
      <span className={styles.icon}>
        <AlertVariantIcon variant={toast.variant} />
      </span>
      <div className={styles.content}>
        {toast.title && <div className={styles.title}>{toast.title}</div>}
        {toast.description && <div className={styles.description}>{toast.description}</div>}
      </div>
      {toast.action && (
        <button type="button" className={styles.action} onClick={toast.action.onClick}>
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        className={styles.dismissButton}
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
      >
        ×
      </button>
    </div>
  );
}

ToastItem.displayName = 'ToastItem';
