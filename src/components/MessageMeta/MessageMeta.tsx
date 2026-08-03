import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { Label } from '../Label/Label';
import { Caption } from '../Caption/Caption';
import styles from './MessageMeta.module.css';

export interface MessageMetaOwnProps {
  /** Sender name, rendered via `Label`. */
  sender: ReactNode;
  /**
   * A `Date` is formatted with `toLocaleTimeString` (hour/minute, locale-
   * default); any other node (a pre-formatted string, a `<time>` element for
   * a custom format) is rendered as-is. Omit for senderless variants
   * (`system`/`status` `MessageBubble`s).
   */
  timestamp?: Date | ReactNode;
}

export type MessageMetaProps = ComponentPropsWithoutRef<'div'> & MessageMetaOwnProps;

function formatTimestamp(timestamp: Date | ReactNode): ReactNode {
  if (timestamp instanceof Date) {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return timestamp;
}

/**
 * The sender label + timestamp row shown above/below a `MessageBubble` —
 * kept as its own component rather than folded into `MessageBubble` so a
 * consumer can place it independently (e.g. once per consecutive run of
 * messages from the same sender, a common chat-UI grouping pattern).
 * Composes `Label` (sender) + `Caption` (timestamp, the same "timestamps"
 * use case its own doc comment already names) instead of new typography.
 */
export const MessageMeta = forwardRef<HTMLDivElement, MessageMetaProps>(function MessageMeta(
  { className, sender, timestamp, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={mergeClasses(styles.meta, className)} {...rest}>
      <Label as="span" weight="medium" className={styles.sender}>
        {sender}
      </Label>
      {timestamp !== undefined && <Caption>{formatTimestamp(timestamp)}</Caption>}
    </div>
  );
});

MessageMeta.displayName = 'MessageMeta';
