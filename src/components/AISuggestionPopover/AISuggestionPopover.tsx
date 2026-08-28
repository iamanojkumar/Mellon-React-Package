import { useState } from 'react';
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
  /**
   * Opens showing an editable textarea pre-filled with this text instead of
   * firing the request immediately — lets the person using the app, not
   * just the integrating developer, steer the instruction before it's sent.
   * Needs `onSubmit`. Re-filled from this value every time the popover
   * opens. Omit (the default) for the original "fetch on open" behaviour —
   * trigger the request yourself from `onOpenChange`.
   */
  editablePrompt?: string;
  /**
   * Fires with the (possibly edited) prompt when the user submits it — via
   * the send button or Ctrl/Cmd+Enter. The owning component is responsible
   * for calling its own `useAIAction().trigger({ prompt })`; this popover
   * doesn't call it directly.
   */
  onSubmit?: (prompt: string) => void;
  /** Accessible label for the editable prompt textarea. Defaults to `'Instruction'`. */
  promptLabel?: string;
  /** Label for the submit button. Defaults to `'Send'`. */
  submitLabel?: string;
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
  editablePrompt,
  onSubmit,
  promptLabel = 'Instruction',
  submitLabel = 'Send',
  placement,
  className,
}: AISuggestionPopoverProps) {
  const [draft, setDraft] = useState(editablePrompt ?? '');
  const showResult = status === 'loading' || status === 'streaming' || status === 'done';
  const showActions = status === 'done' && (onAccept || onReject);
  // Only meaningful when `editablePrompt` is supplied: the form stays up
  // until the owning component actually triggers a request (status leaves
  // `'idle'`) — nothing here calls `trigger()` itself.
  const showPromptForm = editablePrompt !== undefined && status === 'idle';

  function submit() {
    onSubmit?.(draft);
  }

  return (
    <Popover
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(next) => {
        // Re-fills the draft from the latest `editablePrompt` every time the
        // popover opens, rather than carrying over whatever was last typed —
        // the pre-fill is meant to reflect *this* open's context (e.g. the
        // block's current text), not a stale previous instruction.
        if (next) setDraft(editablePrompt ?? '');
        onOpenChange?.(next);
      }}
    >
      <Popover.Trigger as={AITriggerButton} aria-label={triggerLabel} status={status} />
      <Popover.Content placement={placement}>
        <div
          role="dialog"
          aria-label={triggerLabel}
          className={mergeClasses(styles.content, className)}
        >
          {showPromptForm && (
            <form
              className={styles.promptForm}
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <textarea
                className={styles.promptInput}
                aria-label={promptLabel}
                value={draft}
                rows={3}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Plain Enter stays a newline — Ctrl/Cmd+Enter is the
                  // explicit "send" chord, same convention `StickyNote`'s
                  // own editable textarea uses for "done".
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
              <div className={styles.actions}>
                <Button type="submit" variant="primary" size="sm">
                  {submitLabel}
                </Button>
              </div>
            </form>
          )}

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
