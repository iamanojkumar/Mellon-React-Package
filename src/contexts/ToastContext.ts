import { createContext } from 'react';
import type { ReactNode } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Reuses an existing toast (updates it in place) instead of adding a new one, if one with this id is already showing. Auto-generated when omitted. */
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismissing. `0` (or `Infinity`) disables auto-dismiss, requiring manual dismissal. Defaults to 5000. */
  duration?: number;
  action?: ToastAction;
}

export interface ToastRecord {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  variant: ToastVariant;
  duration: number;
  action?: ToastAction;
}

export interface ToastContextValue {
  /** Shows a toast and returns its id (pass it back via `options.id` to update the same toast, or to `dismiss`). */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
