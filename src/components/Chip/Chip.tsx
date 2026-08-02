import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Chip.module.css';

export interface ChipOwnProps {
  /** Shows a remove ("×") button and calls this when it's activated. Omit for a non-removable chip. */
  onRemove?: () => void;
  /** Accessible label for the remove button, e.g. `Remove ${label}`. Defaults to "Remove". */
  removeLabel?: string;
  disabled?: boolean;
  children: ReactNode;
}

export type ChipProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & ChipOwnProps;

/**
 * Interactive, removable pill — for multi-select inputs and filter lists.
 * Not polymorphic: the remove button is a fixed structural part, not a
 * single leaf element (same reasoning as `Input`/`Dialog`).
 */
export const Chip = forwardRef<HTMLSpanElement, ChipProps>(function Chip(
  { className, onRemove, removeLabel = 'Remove', disabled = false, children, ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      className={mergeClasses(styles.chip, className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      <span className={styles.label}>{children}</span>
      {onRemove && (
        <button
          type="button"
          className={styles.removeButton}
          disabled={disabled}
          aria-label={removeLabel}
          onClick={onRemove}
        >
          ×
        </button>
      )}
    </span>
  );
});

Chip.displayName = 'Chip';
