import { Popover } from '../Popover/Popover';
import type { Placement } from '@floating-ui/dom';
import { AITriggerButton } from '../AITriggerButton/AITriggerButton';
import { Button } from '../Button/Button';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { AIActionStatus } from '../../hooks/useAIAction';
import styles from './AISuggestionPopover.module.css';

export interface AISuggestionPopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible label for the trigger button (e.g. `"Rewrite with AI"`). */
  triggerLabel: string;
  status: AIActionStatus;
  /** Accumulated text — the full result once `'done'`, partial while `'streaming'`. */
  result: string;
  error?: string;
  /** Omit for read-only explanations (e.g. `Alert`'s "Explain with AI") that have nothing to accept/reject. */
  onAccept?: (result: string) => void;
  onReject?: () => void;
  onRetry?: () => void;
  placement?: Placement;
  className?: string;
}

/**
 * The shared "small trigger button → popover with result/accept/reject"
 * interaction every AI-enabled flagship component composes, built entirely
 * out of `Popover` + `AITriggerButton` rather than a new overlay primitive
 * — no nested overlay boxes (`Popover.Content` stays the only styled box,
 * per CLAUDE.md's standing rule; our own markup inside it stays layout-only).
 *
 * `Popover.Content` only accepts `placement`/`role`/`children`/`className`
 * and renders `children` through as-is — it doesn't forward an
 * `aria-label`. So the `role="dialog"` + accessible name live on our own
 * inner element, the same "own semantic element inside the generic overlay
 * wrapper" shape `Combobox`'s listbox already uses.
 *
 * Presentational only: it does not call `useAI`/`useAIAction` itself. The
 * owning component runs its own `useAIAction()` instance and passes
 * `status`/`result`/`error` down, typically triggering the request from
 * `onOpenChange` (`open ? aiAction.trigger(...) : aiAction.reset()`) — this
 * keeps the interaction reusable for both "fetch on open" and "fetch on an
 * explicit separate action" flows without baking in one policy here.
 */
export function AISuggestionPopover({
  open,
  defaultOpen,
  onOpenChange,
  triggerLabel,
  status,
  result,
  error,
  onAccept,
  onReject,
  onRetry,
  placement,
  className,
}: AISuggestionPopoverProps) {
  const showResult = status === 'loading' || status === 'streaming' || status === 'done';
  const showActions = status === 'done' && (onAccept || onReject);

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <Popover.Trigger as={AITriggerButton} aria-label={triggerLabel} status={status} />
      <Popover.Content placement={placement}>
        <div
          role="dialog"
          aria-label={triggerLabel}
          className={mergeClasses(styles.content, className)}
        >
          {status === 'error' && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              {onRetry && (
                <Button variant="ghost" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          )}
          {showResult && (
            <div className={styles.resultText} aria-live="polite">
              {result}
            </div>
          )}
          {showActions && (
            <div className={styles.actions}>
              {onReject && (
                <Button variant="ghost" size="sm" onClick={onReject}>
                  Discard
                </Button>
              )}
              {onAccept && (
                <Button variant="primary" size="sm" onClick={() => onAccept(result)}>
                  Accept
                </Button>
              )}
            </div>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}

AISuggestionPopover.displayName = 'AISuggestionPopover';
