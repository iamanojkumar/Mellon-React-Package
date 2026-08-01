import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import { ALIGN_MAP } from '../Flex/Flex';
import type { FlexAlign } from '../Flex/Flex';
import styles from './Stack.module.css';

export interface StackOwnProps extends SpacingProps {
  gap?: SpaceValue;
  align?: FlexAlign;
}

export type StackProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  StackOwnProps
>;

type StackComponent = <C extends ElementType = 'div'>(
  props: StackProps<C>,
) => React.ReactElement | null;

/**
 * A vertical (`flex-direction: column`) stack — a constrained `Flex` for the
 * common single-axis layout case, per SPEC's "favor composition over large
 * prop APIs".
 */
export const Stack = forwardRef(function Stack<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    gap,
    align,
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
  }: StackProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const stackStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...(align !== undefined && { alignItems: ALIGN_MAP[align] }),
    ...(gap !== undefined && { gap: resolveSpace(gap) }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.stack, className)}
      style={stackStyle}
      {...rest}
    />
  );
}) as unknown as StackComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Stack as any).displayName = 'Stack';
