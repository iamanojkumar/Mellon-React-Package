import { forwardRef } from 'react';
import { IconButton } from '../IconButton/IconButton';
import type { IconButtonProps } from '../IconButton/IconButton';
import type { AIActionStatus } from '../../hooks/useAIAction';

export interface AITriggerButtonOwnProps {
  /** Required — an icon-only button has no visible text to fall back on for its accessible name. */
  'aria-label': string;
  /** Drives the busy/loading rendering. Defaults to `'idle'`. */
  status?: AIActionStatus;
}

export type AITriggerButtonProps = Omit<IconButtonProps<'button'>, 'loading' | 'children'> &
  AITriggerButtonOwnProps;

function SparkleIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        d="M10 2.5l1.4 4.1 4.1 1.4-4.1 1.4-1.4 4.1-1.4-4.1-4.1-1.4 4.1-1.4z"
        fill="currentColor"
      />
      <path d="M16 13.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6z" fill="currentColor" />
    </svg>
  );
}

/**
 * Thin preset over `IconButton` — the same "fixed-props layer, not a
 * separate implementation" shape as `Autocomplete`-over-`Combobox`/
 * `PinInput`-over-`OTPInput` (see docs/SPEC.md). `variant`/`size` default
 * to `'ghost'`/`'sm'` but stay overridable (placed before the prop spread);
 * `loading` is derived from `status` and placed *after* the spread so it
 * can't be overridden — the button's busy state must always reflect the
 * real request lifecycle, not an arbitrary prop.
 */
export const AITriggerButton = forwardRef<HTMLButtonElement, AITriggerButtonProps>(
  function AITriggerButton({ status = 'idle', variant = 'ghost', size = 'sm', ...rest }, ref) {
    const loading = status === 'loading' || status === 'streaming';
    return (
      <IconButton ref={ref} variant={variant} size={size} {...rest} loading={loading}>
        <SparkleIcon />
      </IconButton>
    );
  },
);

AITriggerButton.displayName = 'AITriggerButton';

export { SparkleIcon };
