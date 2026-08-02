import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import type { FlexAlign } from '../Flex/Flex';
import styles from './Inline.module.css';

export interface InlineOwnProps extends SpacingProps {
  gap?: SpaceValue;
  align?: FlexAlign;
  /** Wraps to a new line when content overflows. Defaults to `true` — the main difference from `Flex`. */
  wrap?: boolean;
}

export type InlineProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  InlineOwnProps
>;

type InlineComponent = <C extends ElementType = 'div'>(
  props: InlineProps<C>,
) => React.ReactElement | null;

/**
 * `display: inline-flex` row that wraps by default — for runs of small
 * inline elements (tags, chips, badges) that should flow onto new lines
 * instead of overflowing, unlike `Flex`.
 */
export const Inline = forwardRef(function Inline<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    gap,
    align,
    wrap = true,
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
  }: InlineProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const inlineStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...(gap !== undefined && { gap: resolveSpace(gap) }),
    ...(align !== undefined && {
      alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.inline, className)}
      style={inlineStyle}
      data-wrap={wrap || undefined}
      {...rest}
    />
  );
}) as unknown as InlineComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Inline as any).displayName = 'Inline';
