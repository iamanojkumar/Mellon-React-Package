import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextColor, TextSize } from '../Text/Text';
import styles from './Blockquote.module.css';

export interface BlockquoteOwnProps {
  size?: TextSize;
  color?: TextColor;
}

export type BlockquoteProps<C extends ElementType = 'blockquote'> = PolymorphicComponentPropWithRef<
  C,
  BlockquoteOwnProps
>;

type BlockquoteComponent = <C extends ElementType = 'blockquote'>(
  props: BlockquoteProps<C>,
) => React.ReactElement | null;

/** Quoted passage — reuses `Text`'s CSS directly (see `Heading`) with a `<blockquote>` default, a left accent border, and italic styling. */
export const Blockquote = forwardRef(function Blockquote<C extends ElementType = 'blockquote'>(
  { as, className, size = 'md', color = 'secondary', ...rest }: BlockquoteProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'blockquote';

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.blockquote, className)}
      data-size={size}
      data-weight="regular"
      data-color={color}
      {...rest}
    />
  );
}) as unknown as BlockquoteComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Blockquote as any).displayName = 'Blockquote';
