import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './CircularProgress.module.css';

export type CircularProgressSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<CircularProgressSize, number> = {
  sm: 24,
  md: 40,
  lg: 56,
};

const STROKE_WIDTH = 4;

export interface CircularProgressOwnProps {
  /** Current progress. Omit for an indeterminate (unknown-duration) ring. */
  value?: number;
  max?: number;
  size?: CircularProgressSize;
  /** Accessible label, e.g. "Uploading file". */
  label?: string;
}

export type CircularProgressProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  CircularProgressOwnProps;

/** Ring version of `Progress`, via an SVG circle and `stroke-dashoffset`. Same `role="progressbar"` semantics. */
export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  function CircularProgress({ className, value, max = 100, size = 'md', label, ...rest }, ref) {
    const isIndeterminate = value === undefined;
    const clampedValue = isIndeterminate ? undefined : Math.min(Math.max(value, 0), max);

    const diameter = SIZE_PX[size];
    const radius = (diameter - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = isIndeterminate ? undefined : circumference * (1 - clampedValue! / max);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={label}
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        className={mergeClasses(styles.circularProgress, className)}
        data-indeterminate={isIndeterminate || undefined}
        {...rest}
      >
        <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
          <circle
            className={styles.track}
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          <circle
            className={styles.indicator}
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={isIndeterminate ? circumference * 0.75 : offset}
          />
        </svg>
      </div>
    );
  },
);

CircularProgress.displayName = 'CircularProgress';
