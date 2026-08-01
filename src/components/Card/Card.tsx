import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './Card.module.css';

export type CardVariant = 'elevated' | 'outlined';
export type CardElevation = 'sm' | 'md' | 'lg';

export interface CardOwnProps {
  padding?: SpaceValue;
  variant?: CardVariant;
  /** Only applies to the 'elevated' variant. */
  elevation?: CardElevation;
}

export type CardProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  CardOwnProps
>;

type CardComponent = <C extends ElementType = 'div'>(
  props: CardProps<C>,
) => React.ReactElement | null;

/** Content container. Composes `resolveSpace` for a single `padding` prop — a
 * simpler API than Box/Flex/Grid's full spacing set, since Card is a
 * container, not a layout primitive. */
export const Card = forwardRef(function Card<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    padding = 'md',
    variant = 'elevated',
    elevation = 'sm',
    ...rest
  }: CardProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const cardStyle: React.CSSProperties = {
    padding: resolveSpace(padding),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.card, className)}
      style={cardStyle}
      data-variant={variant}
      data-elevation={variant === 'elevated' ? elevation : undefined}
      {...rest}
    />
  );
}) as unknown as CardComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Card as any).displayName = 'Card';
