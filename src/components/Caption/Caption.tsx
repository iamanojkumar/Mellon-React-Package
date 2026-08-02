import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextAlign, TextColor } from '../Text/Text';
import styles from './Caption.module.css';

export interface CaptionOwnProps {
  color?: TextColor;
  align?: TextAlign;
}

export type CaptionProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  CaptionOwnProps
>;

type CaptionComponent = <C extends ElementType = 'span'>(
  props: CaptionProps<C>,
) => React.ReactElement | null;

/** Small muted annotation text (image captions, timestamps, footnotes) — reuses `Text`'s CSS directly (see `Heading`), fixed at the `xs` size. */
export const Caption = forwardRef(function Caption<C extends ElementType = 'span'>(
  { as, className, color = 'secondary', align, ...rest }: CaptionProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.caption, className)}
      data-size="xs"
      data-weight="regular"
      data-color={color}
      data-align={align}
      {...rest}
    />
  );
}) as unknown as CaptionComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Caption as any).displayName = 'Caption';
