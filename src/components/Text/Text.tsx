import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type TextWeight = 'regular' | 'medium' | 'bold';
export type TextColor =
  'primary' | 'secondary' | 'inverse' | 'disabled' | 'brand' | 'success' | 'warning' | 'danger';
export type TextAlign = 'start' | 'center' | 'end' | 'justify';

export interface TextOwnProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  /** Truncates overflowing text with an ellipsis on a single line. */
  truncate?: boolean;
}

export type TextProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  TextOwnProps
>;

type TextComponent = <C extends ElementType = 'span'>(
  props: TextProps<C>,
) => React.ReactElement | null;

/**
 * Typography primitive. Variant props (size/weight/color/align/truncate)
 * are applied as `data-*` attributes rather than modifier classes — see
 * docs/SPEC.md "Styling Strategy" for the rationale (each axis stays an
 * independent, inspectable attribute instead of combinatorial class names).
 */
export const Text = forwardRef(function Text<C extends ElementType = 'span'>(
  {
    as,
    className,
    size = 'md',
    weight = 'regular',
    color = 'primary',
    align,
    truncate = false,
    ...rest
  }: TextProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';
  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.text, className)}
      data-size={size}
      data-weight={weight}
      data-color={color}
      data-align={align}
      data-truncate={truncate || undefined}
      {...rest}
    />
  );
}) as unknown as TextComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Text as any).displayName = 'Text';
