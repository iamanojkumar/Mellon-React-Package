import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import styles from './Flex.module.css';

export type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse';
export type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

export const ALIGN_MAP: Record<FlexAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const JUSTIFY_MAP: Record<FlexJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export interface FlexOwnProps extends SpacingProps {
  direction?: FlexDirection;
  align?: FlexAlign;
  justify?: FlexJustify;
  wrap?: FlexWrap;
  gap?: SpaceValue;
}

export type FlexProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  FlexOwnProps
>;

type FlexComponent = <C extends ElementType = 'div'>(
  props: FlexProps<C>,
) => React.ReactElement | null;

/**
 * `display: flex` layout primitive. Composes the same spacing props as
 * `Box` (via the shared `resolveSpacingStyle`) plus flex-specific props —
 * see docs/SPEC.md "Styling Strategy".
 */
export const Flex = forwardRef(function Flex<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    direction,
    align,
    justify,
    wrap,
    gap,
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
  }: FlexProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const flexStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...(direction !== undefined && { flexDirection: direction }),
    ...(align !== undefined && { alignItems: ALIGN_MAP[align] }),
    ...(justify !== undefined && { justifyContent: JUSTIFY_MAP[justify] }),
    ...(wrap !== undefined && { flexWrap: wrap }),
    ...(gap !== undefined && { gap: resolveSpace(gap) }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.flex, className)}
      style={flexStyle}
      {...rest}
    />
  );
}) as unknown as FlexComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Flex as any).displayName = 'Flex';
