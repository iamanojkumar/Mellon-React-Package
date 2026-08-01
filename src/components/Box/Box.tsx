import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './Box.module.css';

export type { SpaceValue };

export type BoxOwnProps = SpacingProps;

export type BoxProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  BoxOwnProps
>;

type BoxComponent = <C extends ElementType = 'div'>(
  props: BoxProps<C>,
) => React.ReactElement | null;

/**
 * Unstyled layout primitive every other component composes from.
 * Spacing props resolve to `--ds-space-*` tokens so no component ever
 * hardcodes a length — see docs/SPEC.md "Styling Strategy".
 */
export const Box = forwardRef(function Box<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    ...rest
  }: BoxProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const boxStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.box, className)}
      style={boxStyle}
      {...rest}
    />
  );
}) as unknown as BoxComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Box as any).displayName = 'Box';
