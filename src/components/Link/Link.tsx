import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextColor, TextSize, TextWeight } from '../Text/Text';
import styles from './Link.module.css';

export interface LinkOwnProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
}

export type LinkProps<C extends ElementType = 'a'> = PolymorphicComponentPropWithRef<
  C,
  LinkOwnProps
>;

type LinkComponent = <C extends ElementType = 'a'>(
  props: LinkProps<C>,
) => React.ReactElement | null;

/** Reuses `Text`'s CSS directly (see `Heading`) with an `<a>` default and its own underline/hover/focus-visible styling. */
export const Link = forwardRef(function Link<C extends ElementType = 'a'>(
  { as, className, size = 'md', weight = 'regular', color = 'brand', ...rest }: LinkProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'a';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.link, className)}
      data-size={size}
      data-weight={weight}
      data-color={color}
      {...rest}
    />
  );
}) as unknown as LinkComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Link as any).displayName = 'Link';
