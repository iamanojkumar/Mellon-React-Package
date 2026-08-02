import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextAlign, TextColor, TextSize, TextWeight } from '../Text/Text';
import styles from './Paragraph.module.css';

export interface ParagraphOwnProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
}

export type ParagraphProps<C extends ElementType = 'p'> = PolymorphicComponentPropWithRef<
  C,
  ParagraphOwnProps
>;

type ParagraphComponent = <C extends ElementType = 'p'>(
  props: ParagraphProps<C>,
) => React.ReactElement | null;

/** Block-level body copy — reuses `Text`'s CSS directly (see `Heading`), with a `<p>` default and a bit of vertical rhythm (`margin-bottom`) between consecutive paragraphs. */
export const Paragraph = forwardRef(function Paragraph<C extends ElementType = 'p'>(
  {
    as,
    className,
    size = 'md',
    weight = 'regular',
    color = 'primary',
    align,
    ...rest
  }: ParagraphProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'p';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.paragraph, className)}
      data-size={size}
      data-weight={weight}
      data-color={color}
      data-align={align}
      {...rest}
    />
  );
}) as unknown as ParagraphComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Paragraph as any).displayName = 'Paragraph';
