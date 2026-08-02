import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './Spacer.module.css';

export interface SpacerOwnProps {
  /** A fixed size instead of the default flexible (`flex: 1`) behavior. */
  size?: SpaceValue;
}

export type SpacerProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  SpacerOwnProps
>;

type SpacerComponent = <C extends ElementType = 'div'>(
  props: SpacerProps<C>,
) => React.ReactElement | null;

/**
 * Purely a layout primitive, no content — `aria-hidden` unconditionally.
 * Without `size`, grows to fill available space in a `Flex`/`Inline` row
 * (pushing siblings apart); with `size`, a fixed-width/height gap instead.
 */
export const Spacer = forwardRef(function Spacer<C extends ElementType = 'div'>(
  { as, className, style, size, ...rest }: SpacerProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';
  const resolvedSize = size !== undefined ? resolveSpace(size) : undefined;

  const spacerStyle: React.CSSProperties = {
    ...(resolvedSize !== undefined
      ? { flex: '0 0 auto', width: resolvedSize, height: resolvedSize }
      : { flex: '1 1 0%' }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      aria-hidden="true"
      className={mergeClasses(styles.spacer, className)}
      style={spacerStyle}
      {...rest}
    />
  );
}) as unknown as SpacerComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Spacer as any).displayName = 'Spacer';
