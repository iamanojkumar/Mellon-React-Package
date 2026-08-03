import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import cardStyles from '../Card/Card.module.css';
import styles from './MessageBubble.module.css';

export type MessageBubbleVariant = 'user' | 'ai' | 'system' | 'tool' | 'error' | 'status';

export interface MessageBubbleOwnProps {
  variant?: MessageBubbleVariant;
  /** Slot for an `Avatar` (or any node) rendered beside the bubble. Omit for `system`/`status` messages, which have no sender. */
  avatar?: ReactNode;
  children: ReactNode;
}

export type MessageBubbleProps = ComponentPropsWithoutRef<'div'> & MessageBubbleOwnProps;

/**
 * A single chat turn. Reuses `Card`'s base box (`background`/`border-radius`)
 * for the bubble itself via a doubled-class override
 * (`.bubble.bubble[data-variant=...]`, per CLAUDE.md's cross-component-CSS
 * hazard #2) rather than duplicating that box styling — `Card`'s own
 * `data-variant` vocabulary ('elevated'/'outlined') never matches ours, so
 * reusing the same attribute name is safe, just two unrelated vocabularies
 * sharing the established "variant → data-attribute" convention.
 *
 * `variant='user'` reverses the row (avatar/bubble on the right) — the
 * standard sent-vs-received chat layout — purely via CSS, no extra `align`
 * prop. `variant='error'` gets `role="alert"`, the same urgent-variant
 * precedent `Alert` already established; every other variant stays
 * silent (the surrounding conversation container owns the live-region
 * semantics, e.g. `role="log"`).
 *
 * Sender/timestamp are deliberately not part of this component — compose
 * `MessageMeta` above or below it.
 */
export const MessageBubble = forwardRef<HTMLDivElement, MessageBubbleProps>(function MessageBubble(
  { className, variant = 'ai', avatar, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      role={variant === 'error' ? 'alert' : undefined}
      className={mergeClasses(styles.wrapper, className)}
      data-variant={variant}
      {...rest}
    >
      {avatar && <div className={styles.avatar}>{avatar}</div>}
      <div className={mergeClasses(cardStyles.card, styles.bubble)} data-variant={variant}>
        {children}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
