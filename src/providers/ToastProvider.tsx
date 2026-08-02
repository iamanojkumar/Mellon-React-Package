import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Portal } from '../components/Portal/Portal';
import { ToastItem } from '../components/Toast/ToastItem';
import styles from '../components/Toast/Toast.module.css';
import { ToastContext } from '../contexts/ToastContext';
import type { ToastContextValue, ToastOptions, ToastRecord } from '../contexts/ToastContext';

export type ToastPosition =
  'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface ToastProviderProps {
  children?: ReactNode;
  /** Corner (or edge-center) the toast viewport anchors to. Defaults to `'bottom-right'`. */
  position?: ToastPosition;
  /** Max toasts visible at once — oldest is dropped once a new one would exceed it. Defaults to 5. */
  limit?: number;
  /** Auto-dismiss duration (ms) for toasts that don't set their own via `toast({ duration })`. Defaults to 5000. */
  defaultDuration?: number;
}

const DEFAULT_DURATION = 5000;

/**
 * Mounts a `Portal`-rendered toast viewport and provides `useToast()` to
 * the subtree — same Context/Provider/Hook split as `ThemeProvider`/
 * `useTheme`, except this one genuinely renders UI (the viewport + queued
 * `ToastItem`s), unlike `ThemeProvider`'s pure `data-theme` side effect,
 * which is why it colocates with `src/components/Toast/` rather than
 * living provider-only.
 *
 * Global `position` (set once here, not per-toast) — matches how every
 * other toast-style library in common use works, and keeps `ToastOptions`
 * simple rather than needing per-toast placement plumbing.
 */
export function ToastProvider({
  children,
  position = 'bottom-right',
  limit = 5,
  defaultDuration = DEFAULT_DURATION,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const idCounterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? `toast-${++idCounterRef.current}`;
      const record: ToastRecord = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? 'info',
        duration: options.duration ?? defaultDuration,
        action: options.action,
      };
      setToasts((current) => {
        const existingIndex = current.findIndex((item) => item.id === id);
        const next =
          existingIndex >= 0
            ? current.map((item) => (item.id === id ? record : item))
            : [...current, record];
        return next.slice(-limit);
      });
      return id;
    },
    [defaultDuration, limit],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toast, dismiss, dismissAll }),
    [toast, dismiss, dismissAll],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal>
        <div
          className={styles.viewport}
          data-position={position}
          role="region"
          aria-label="Notifications"
        >
          {toasts.map((item) => (
            <ToastItem key={item.id} toast={item} onDismiss={dismiss} />
          ))}
        </div>
      </Portal>
    </ToastContext.Provider>
  );
}
