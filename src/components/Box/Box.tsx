import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef, PolymorphicRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Box.module.css';

const SPACE_TOKENS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']);

export type SpaceValue = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | (string & {}) | number;

function resolveSpace(value: SpaceValue | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  if (SPACE_TOKENS.has(value)) return `var(--ds-space-${value})`;
  return value;
}

export interface BoxOwnProps {
  p?: SpaceValue;
  px?: SpaceValue;
  py?: SpaceValue;
  pt?: SpaceValue;
  pr?: SpaceValue;
  pb?: SpaceValue;
  pl?: SpaceValue;
  m?: SpaceValue;
  mx?: SpaceValue;
  my?: SpaceValue;
  mt?: SpaceValue;
  mr?: SpaceValue;
  mb?: SpaceValue;
  ml?: SpaceValue;
}

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
export const Box: BoxComponent = forwardRef(function Box<C extends ElementType = 'div'>(
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
  ref?: PolymorphicRef<C>,
) {
  const Component = as || 'div';

  const boxStyle: React.CSSProperties = {
    ...(p !== undefined && { padding: resolveSpace(p) }),
    ...(px !== undefined && { paddingInline: resolveSpace(px) }),
    ...(py !== undefined && { paddingBlock: resolveSpace(py) }),
    ...(pt !== undefined && { paddingTop: resolveSpace(pt) }),
    ...(pr !== undefined && { paddingRight: resolveSpace(pr) }),
    ...(pb !== undefined && { paddingBottom: resolveSpace(pb) }),
    ...(pl !== undefined && { paddingLeft: resolveSpace(pl) }),
    ...(m !== undefined && { margin: resolveSpace(m) }),
    ...(mx !== undefined && { marginInline: resolveSpace(mx) }),
    ...(my !== undefined && { marginBlock: resolveSpace(my) }),
    ...(mt !== undefined && { marginTop: resolveSpace(mt) }),
    ...(mr !== undefined && { marginRight: resolveSpace(mr) }),
    ...(mb !== undefined && { marginBottom: resolveSpace(mb) }),
    ...(ml !== undefined && { marginLeft: resolveSpace(ml) }),
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
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Box as any).displayName = 'Box';
