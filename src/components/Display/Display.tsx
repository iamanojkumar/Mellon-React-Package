import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextAlign, TextColor, TextWeight } from '../Text/Text';
import styles from './Display.module.css';

export type DisplaySize = 'sm' | 'md' | 'lg';

export interface DisplayOwnProps {
  size?: DisplaySize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
}

export type DisplayProps<C extends ElementType = 'p'> = PolymorphicComponentPropWithRef<
  C,
  DisplayOwnProps
>;

type DisplayComponent = <C extends ElementType = 'p'>(
  props: DisplayProps<C>,
) => React.ReactElement | null;

/**
 * Large hero/marketing text — bigger than `Heading`'s own `xl`, so it uses
 * its own `data-display-size` scale (own CSS, `calc()` off
 * `--ds-font-size-xl`) instead of reusing `Text`'s `data-size`, while still
 * reusing `Text`'s weight/color/align CSS rules directly (same approach as
 * `Heading` — see that component for why: identical rendering without
 * cross-component JSX composition).
 */
export const Display = forwardRef(function Display<C extends ElementType = 'p'>(
  {
    as,
    className,
    size = 'md',
    weight = 'bold',
    color = 'primary',
    align,
    ...rest
  }: DisplayProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'p';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.display, className)}
      data-display-size={size}
      data-weight={weight}
      data-color={color}
      data-align={align}
      {...rest}
    />
  );
}) as unknown as DisplayComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Display as any).displayName = 'Display';
