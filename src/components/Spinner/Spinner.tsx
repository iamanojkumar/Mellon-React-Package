import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerOwnProps {
  size?: SpinnerSize;
  /** Accessible label announced by assistive tech. Defaults to "Loading". */
  label?: string;
}

export type SpinnerProps = Omit<ComponentPropsWithoutRef<'span'>, 'children'> & SpinnerOwnProps;

/** Indeterminate rotating loading indicator. `role="status"` with `label` as its accessible name. */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner(
  { className, size = 'md', label = 'Loading', ...rest },
  ref,
) {
  return (
    <span
      ref={ref}
      role="status"
      aria-label={label}
      className={mergeClasses(styles.spinner, className)}
      data-size={size}
      {...rest}
    />
  );
});

Spinner.displayName = 'Spinner';
