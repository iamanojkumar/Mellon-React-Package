import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Progress.module.css';

export type ProgressSize = 'sm' | 'md' | 'lg';

export interface ProgressOwnProps {
  /** Current progress. Omit for an indeterminate (unknown-duration) bar. */
  value?: number;
  max?: number;
  size?: ProgressSize;
  /** Accessible label, e.g. "Uploading file". */
  label?: string;
}

export type ProgressProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & ProgressOwnProps;

/** Linear progress bar. `role="progressbar"`; omitting `value` renders an indeterminate animation instead of a fixed fill. */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(function Progress(
  { className, value, max = 100, size = 'md', label, ...rest },
  ref,
) {
  const isIndeterminate = value === undefined;
  const clampedValue = isIndeterminate ? undefined : Math.min(Math.max(value, 0), max);

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-label={label}
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      className={mergeClasses(styles.track, className)}
      data-size={size}
      data-indeterminate={isIndeterminate || undefined}
      {...rest}
    >
      <div
        className={styles.fill}
        style={isIndeterminate ? undefined : { width: `${(clampedValue! / max) * 100}%` }}
      />
    </div>
  );
});

Progress.displayName = 'Progress';
