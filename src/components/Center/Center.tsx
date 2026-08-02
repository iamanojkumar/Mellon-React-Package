import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import styles from './Center.module.css';

export interface CenterOwnProps extends SpacingProps {
  /** Uses `inline-flex` instead of `flex`. Defaults to `false`. */
  inline?: boolean;
}

export type CenterProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  CenterOwnProps
>;

type CenterComponent = <C extends ElementType = 'div'>(
  props: CenterProps<C>,
) => React.ReactElement | null;

/** Centers its children both horizontally and vertically via flexbox. */
export const Center = forwardRef(function Center<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    inline = false,
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
  }: CenterProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const centerStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.center, className)}
      style={centerStyle}
      data-inline={inline || undefined}
      {...rest}
    />
  );
}) as unknown as CenterComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Center as any).displayName = 'Center';
