import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { IconButton } from '../IconButton/IconButton';
import styles from './FeedbackControl.module.css';

export type FeedbackValue = 'up' | 'down' | null;

export interface FeedbackControlOwnProps {
  value?: FeedbackValue;
  defaultValue?: FeedbackValue;
  /** Fires whenever the up/down selection changes, including back to `null` when the pressed one is clicked again. */
  onChange?: (value: FeedbackValue) => void;
  /** Shows a third "Report" button when given — a separate action from the up/down toggle, not part of its mutual exclusivity. */
  onReport?: () => void;
  upLabel?: string;
  downLabel?: string;
  reportLabel?: string;
  /** Accessible label for the group wrapping all three buttons. */
  groupLabel?: string;
}

export type FeedbackControlProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  FeedbackControlOwnProps;

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        d="M7 8.5v8h8.2a1.5 1.5 0 0 0 1.47-1.2l1-5A1.5 1.5 0 0 0 16.2 8.5H12l.6-3.3a1.4 1.4 0 0 0-2.5-1.1L7 8.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7 8.5H4.5v8H7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        d="M13 11.5v-8H4.8a1.5 1.5 0 0 0-1.47 1.2l-1 5A1.5 1.5 0 0 0 3.8 11.5H8l-.6 3.3a1.4 1.4 0 0 0 2.5 1.1L13 11.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M13 11.5h2.5v-8H13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        d="M5 3v14M5 3.75h9l-2.5 3.25L14 10.25H5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Thumbs up/down (mutually exclusive, click-to-toggle-off) plus an
 * optional separate "Report" action. Built directly on `IconButton` +
 * manual `aria-pressed` rather than reusing `ToggleButton` twice — a
 * mutually-exclusive pair needs one shared piece of state (selecting "up"
 * must clear "down"), which fighting two independent `ToggleButton`
 * internal booleans can't express cleanly; `useControllableState` is used
 * directly instead, same hook `ToggleButton` itself is built on.
 */
export const FeedbackControl = forwardRef<HTMLDivElement, FeedbackControlProps>(
  function FeedbackControl(
    {
      className,
      value,
      defaultValue = null,
      onChange,
      onReport,
      upLabel = 'Good response',
      downLabel = 'Bad response',
      reportLabel = 'Report',
      groupLabel = 'Message feedback',
      ...rest
    },
    ref,
  ) {
    const [feedback, setFeedback] = useControllableState<FeedbackValue>({
      value,
      defaultValue,
      onChange,
    });

    function toggle(next: 'up' | 'down') {
      setFeedback(feedback === next ? null : next);
    }

    return (
      <div
        ref={ref}
        role="group"
        aria-label={groupLabel}
        className={mergeClasses(styles.control, className)}
        {...rest}
      >
        <IconButton
          variant="ghost"
          size="sm"
          className={styles.thumbButton}
          aria-label={upLabel}
          aria-pressed={feedback === 'up'}
          data-pressed={feedback === 'up' || undefined}
          onClick={() => toggle('up')}
        >
          <ThumbUpIcon />
        </IconButton>
        <IconButton
          variant="ghost"
          size="sm"
          className={styles.thumbButton}
          aria-label={downLabel}
          aria-pressed={feedback === 'down'}
          data-pressed={feedback === 'down' || undefined}
          onClick={() => toggle('down')}
        >
          <ThumbDownIcon />
        </IconButton>
        {onReport && (
          <IconButton variant="ghost" size="sm" aria-label={reportLabel} onClick={onReport}>
            <FlagIcon />
          </IconButton>
        )}
      </div>
    );
  },
);

FeedbackControl.displayName = 'FeedbackControl';
