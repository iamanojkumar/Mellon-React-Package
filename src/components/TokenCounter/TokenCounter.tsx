import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './TokenCounter.module.css';

export interface TokenCounterOwnProps {
  /** The composer's current text. */
  value: string;
  /**
   * Estimates a token count from `value`. Defaults to `Math.ceil(length /
   * 4)` — the commonly cited "~4 characters per token" rule of thumb for
   * English text, not a real tokenizer. Pass your own for exact counts
   * (e.g. wrapping `tiktoken` or a provider's own counting endpoint) — this
   * library never bundles a tokenizer, the same "no vendor SDK" boundary
   * `AIClient` draws for completions.
   */
  estimateTokens?: (text: string) => number;
  /** Shown as "count / limit" once given, plus a `data-over-limit` flag once `count` exceeds it. */
  limit?: number;
}

export type TokenCounterProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> &
  TokenCounterOwnProps;

function defaultEstimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * A live token/character estimate readout for a composer. Deliberately not
 * a `role="status"` live region — unlike `StatusLine` (a one-time
 * transient announcement), this recalculates on every keystroke, and
 * announcing every keystroke's new count would spam assistive tech; the
 * count is visible text like `Statistic`'s, not an active notification.
 */
export const TokenCounter = forwardRef<HTMLSpanElement, TokenCounterProps>(function TokenCounter(
  { className, value, estimateTokens = defaultEstimateTokens, limit, ...rest },
  ref,
) {
  const count = estimateTokens(value);
  const overLimit = limit !== undefined && count > limit;

  return (
    <span
      ref={ref}
      className={mergeClasses(styles.counter, className)}
      data-over-limit={overLimit || undefined}
      {...rest}
    >
      {limit !== undefined ? `${count} / ${limit}` : count}
    </span>
  );
});

TokenCounter.displayName = 'TokenCounter';
