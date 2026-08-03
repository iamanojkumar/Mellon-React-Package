import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './TypingIndicator.module.css';

export type TypingIndicatorSize = 'sm' | 'md' | 'lg';

export interface TypingIndicatorOwnProps {
  size?: TypingIndicatorSize;
  /** Accessible label announced by assistive tech. Defaults to "Typing". */
  label?: string;
}

export type TypingIndicatorProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> &
  TypingIndicatorOwnProps;

/**
 * Three animated dots signaling an in-progress AI turn — presentational
 * only, the same "doesn't call `useAI`/`useAIAction` itself" precedent
 * `AISuggestionPopover` established. The owning component decides when to
 * render it, typically while its own `useAIAction().status` is `'loading'`.
 * `role="status"` + `label` mirrors `Spinner`'s exact accessibility shape —
 * this is `Spinner`'s bouncing-dots sibling for chat-turn contexts.
 */
export const TypingIndicator = forwardRef<HTMLSpanElement, TypingIndicatorProps>(
  function TypingIndicator({ className, size = 'md', label = 'Typing', ...rest }, ref) {
    return (
      <span
        ref={ref}
        role="status"
        aria-label={label}
        className={mergeClasses(styles.indicator, className)}
        data-size={size}
        {...rest}
      >
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </span>
    );
  },
);

TypingIndicator.displayName = 'TypingIndicator';
