import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonOwnProps {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
}

export type SkeletonProps = ComponentPropsWithoutRef<'div'> & SkeletonOwnProps;

/**
 * Loading placeholder shimmer. `aria-hidden` unconditionally — it's a
 * purely visual stand-in, not itself an announcement; pair it with a
 * `Spinner` or an `aria-busy` container for the actual loading status.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { className, style, variant = 'text', width, height, ...rest },
  ref,
) {
  const resolvedStyle: CSSProperties = {
    ...(width !== undefined && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height !== undefined && { height: typeof height === 'number' ? `${height}px` : height }),
    ...style,
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={mergeClasses(styles.skeleton, className)}
      style={resolvedStyle}
      data-variant={variant}
      {...rest}
    />
  );
});

Skeleton.displayName = 'Skeleton';
