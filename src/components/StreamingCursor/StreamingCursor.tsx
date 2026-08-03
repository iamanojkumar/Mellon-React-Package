import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './StreamingCursor.module.css';

export type StreamingCursorProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'>;

/**
 * A blinking vertical bar appended to the end of AI response text while
 * it's still streaming in — purely decorative (`aria-hidden`), since the
 * text it sits beside already carries its own `aria-live="polite"` region
 * (the same `AISuggestionPopover.resultText` shape every AI-enhanced
 * component already uses); the cursor itself has nothing to announce.
 */
export const StreamingCursor = forwardRef<HTMLSpanElement, StreamingCursorProps>(
  function StreamingCursor({ className, ...rest }, ref) {
    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={mergeClasses(styles.cursor, className)}
        {...rest}
      />
    );
  },
);

StreamingCursor.displayName = 'StreamingCursor';
