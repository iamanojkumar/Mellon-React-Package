import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Divider.module.css';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerOwnProps {
  orientation?: DividerOrientation;
}

export type DividerProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  DividerOwnProps
>;

type DividerComponent = <C extends ElementType = 'div'>(
  props: DividerProps<C>,
) => React.ReactElement | null;

/**
 * `role="separator"` on a plain `<div>` rather than a native `<hr>` (which
 * is horizontal-only) so one component covers both orientations correctly.
 */
export const Divider = forwardRef(function Divider<C extends ElementType = 'div'>(
  { as, className, orientation = 'horizontal', ...rest }: DividerProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  return (
    <Component
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      className={mergeClasses(styles.divider, className)}
      data-orientation={orientation}
      {...rest}
    />
  );
}) as unknown as DividerComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Divider as any).displayName = 'Divider';
