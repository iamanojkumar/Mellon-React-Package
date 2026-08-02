import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Badge.module.css';

export type BadgeColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type BadgeVariant = 'solid' | 'subtle';

export interface BadgeOwnProps {
  color?: BadgeColor;
  variant?: BadgeVariant;
}

export type BadgeProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  BadgeOwnProps
>;

type BadgeComponent = <C extends ElementType = 'span'>(
  props: BadgeProps<C>,
) => React.ReactElement | null;

/** Small status/count pill (e.g. "New", "3", "Beta") — not interactive or removable, unlike `Chip`. */
export const Badge = forwardRef(function Badge<C extends ElementType = 'span'>(
  { as, className, color = 'neutral', variant = 'subtle', ...rest }: BadgeProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.badge, className)}
      data-color={color}
      data-variant={variant}
      {...rest}
    />
  );
}) as unknown as BadgeComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Badge as any).displayName = 'Badge';
