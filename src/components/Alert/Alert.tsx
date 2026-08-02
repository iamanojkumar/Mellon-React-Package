import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Alert.module.css';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface AlertBuildAIPromptProps {
  variant: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
}

export interface AlertOwnProps {
  variant?: AlertVariant;
  title?: ReactNode;
  /** Shows a "×" dismiss button and calls this when it's activated. Omit for a non-dismissible alert. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  children?: ReactNode;
  /**
   * Adds an AI-powered "Explain with AI" affordance next to the dismiss
   * button — a trigger opening an `AISuggestionPopover` with the likely
   * cause/impact/fix. Off by default, and a no-op even when `true` unless
   * an ancestor `AIProvider` is mounted — the rendered output is
   * byte-identical to today's whenever this doesn't apply. Read-only: no
   * accept/reject, since an explanation isn't something to replace the
   * alert's own content with.
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from this alert's variant/title/children. Defaults to a generic cause/impact/fix instruction. */
  buildAIPrompt?: (props: AlertBuildAIPromptProps) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

export type AlertProps = Omit<ComponentPropsWithoutRef<'div'>, 'title'> & AlertOwnProps;

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.25em" height="1.25em" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.25" r="1" fill="currentColor" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.25em" height="1.25em" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10.2l2.3 2.3 4.7-4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.25em" height="1.25em" aria-hidden="true">
      <path
        d="M10 2.5l8.25 14.5H1.75z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="1" fill="currentColor" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.25em" height="1.25em" aria-hidden="true">
      <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The per-variant icon, exported so `Banner`/`Toast` can reuse the exact
 * same glyphs rather than each defining their own — plain inline SVG, no
 * icon library exists in this project (same precedent as `PasswordField`'s
 * eye icons, `Checkbox`'s checkmark).
 */
export function AlertVariantIcon({ variant }: { variant: AlertVariant }) {
  switch (variant) {
    case 'success':
      return <SuccessIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'danger':
      return <DangerIcon />;
    default:
      return <InfoIcon />;
  }
}

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt({ variant, title, children }: AlertBuildAIPromptProps): string {
  const lines = [`Alert variant: ${variant}`];
  const titleText = nodeToText(title);
  const messageText = nodeToText(children);
  if (titleText) lines.push(`Title: ${titleText}`);
  if (messageText) lines.push(`Message: ${messageText}`);
  lines.push('Explain the likely cause, the impact, and a suggested fix.');
  return lines.join('\n');
}

/**
 * Static, inline feedback — not an overlay (no `Portal`, no backdrop; it
 * renders exactly where it's placed in the tree, like `Badge`/`Chip`).
 * `role="alert"` for `warning`/`danger` (interrupts screen readers
 * immediately — appropriate for something that needs urgent attention)
 * vs. `role="status"` (polite, waits for a pause) for `info`/`success` —
 * the same urgency-based split `Toast` uses for its own items. `variant
 * ="info"` uses `--ds-color-brand-primary`, not a separate "info" status
 * token — there isn't one in this token set, the same choice `Badge`
 * already made for its own `data-color="brand"`.
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    className,
    variant = 'info',
    title,
    onDismiss,
    dismissLabel = 'Dismiss',
    children,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    ...rest
  },
  ref,
) {
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const dismissButton = onDismiss && (
    <button
      type="button"
      className={styles.dismissButton}
      aria-label={dismissLabel}
      onClick={onDismiss}
    >
      ×
    </button>
  );

  const aiTrigger = showAI && (
    <AISuggestionPopover
      triggerLabel={aiExplainLabel}
      status={aiAction.status}
      result={aiAction.result}
      error={aiAction.error}
      onOpenChange={(open) => {
        if (open) {
          aiAction.trigger({ prompt: buildAIPrompt({ variant, title, children }) });
        } else {
          aiAction.reset();
        }
      }}
      onRetry={() => aiAction.trigger({ prompt: buildAIPrompt({ variant, title, children }) })}
    />
  );

  return (
    <div
      ref={ref}
      role={variant === 'warning' || variant === 'danger' ? 'alert' : 'status'}
      className={mergeClasses(styles.alert, className)}
      data-variant={variant}
      {...rest}
    >
      <span className={styles.icon}>
        <AlertVariantIcon variant={variant} />
      </span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {children && <div className={styles.description}>{children}</div>}
      </div>
      {showAI ? (
        <div className={styles.actions}>
          {aiTrigger}
          {dismissButton}
        </div>
      ) : (
        dismissButton
      )}
    </div>
  );
});

Alert.displayName = 'Alert';
