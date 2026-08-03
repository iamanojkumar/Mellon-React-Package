import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './MemoryListItem.module.css';

export interface MemoryListItemOwnProps {
  /** The saved memory's text. */
  children: ReactNode;
  /** Shows a "Forget" icon button when given. */
  onForget?: () => void;
  forgetLabel?: string;
}

export type MemoryListItemProps = Omit<
  ComponentPropsWithoutRef<'li'>,
  keyof MemoryListItemOwnProps
> &
  MemoryListItemOwnProps;

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true">
      <path
        d="M4.5 6h11M8 6V4.5h4V6M6 6l.6 9.5A1 1 0 0 0 7.6 16.5h4.8a1 1 0 0 0 1-.9L14 6"
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
 * A single saved/retrieved memory — a `<li>`, meant to live inside
 * `MemoryEditor`'s `<ul>` (or any other list a consumer builds around it).
 * Presentational only: `onForget` is the consumer's own removal logic,
 * this component just renders the trigger.
 */
export const MemoryListItem = forwardRef<HTMLLIElement, MemoryListItemProps>(
  function MemoryListItem({ className, children, onForget, forgetLabel = 'Forget', ...rest }, ref) {
    return (
      <li ref={ref} className={mergeClasses(styles.item, className)} {...rest}>
        <span className={styles.text}>{children}</span>
        {onForget && (
          <IconButton variant="ghost" size="sm" aria-label={forgetLabel} onClick={onForget}>
            <TrashIcon />
          </IconButton>
        )}
      </li>
    );
  },
);

MemoryListItem.displayName = 'MemoryListItem';
