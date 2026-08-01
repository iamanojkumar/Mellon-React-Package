import React, { forwardRef } from 'react';
import type { ElementType, ForwardRefRenderFunction } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import type { TextAlign, TextColor, TextSize, TextWeight } from '../Text/Text';
import styles from './Heading.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const LEVEL_SIZE_MAP: Record<HeadingLevel, TextSize> = {
  1: 'xl',
  2: 'lg',
  3: 'md',
  4: 'md',
  5: 'sm',
  6: 'xs',
};

export interface HeadingOwnProps {
  /** Semantic heading level (1–6). Picks the default tag (h1–h6) and size. */
  level: HeadingLevel;
  /** Overrides the size that `level` would otherwise default to. */
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  truncate?: boolean;
}

export type HeadingProps<C extends ElementType = 'h1'> = PolymorphicComponentPropWithRef<
  C,
  HeadingOwnProps
>;

type HeadingComponent = <C extends ElementType = 'h1'>(
  props: HeadingProps<C>,
) => React.ReactElement | null;

/**
 * Semantic heading. Reuses `Text`'s CSS (imported directly, not composed as
 * a component — see Flex/Box for why avoiding cross-component generic JSX
 * composition is preferred here) so size/weight/color/align/truncate render
 * identically to `Text`, with heading-appropriate defaults (bold, size
 * derived from `level`) and the correct semantic tag.
 */
// `level` is required on HeadingOwnProps, which trips up forwardRef's
// generic type-checking when it verifies the render function against the
// worst-case `C = ElementType` instantiation (TS loses the "required"-ness
// across that distribution). Casting the render function to the exact
// shape forwardRef expects sidesteps that internal check — consumers still
// get a correctly-typed `HeadingProps<C>` requiring `level` at the call site.
function HeadingRender<C extends ElementType = 'h1'>(
  {
    as,
    className,
    level,
    size,
    weight = 'bold',
    color = 'primary',
    align,
    truncate = false,
    ...rest
  }: HeadingProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as ?? (`h${level}` as ElementType);
  const resolvedSize = size ?? LEVEL_SIZE_MAP[level];

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.heading, className)}
      data-size={resolvedSize}
      data-weight={weight}
      data-color={color}
      data-align={align}
      data-truncate={truncate || undefined}
      {...rest}
    />
  );
}

export const Heading = forwardRef(
  HeadingRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<HeadingProps<ElementType>, 'ref'>
  >,
) as unknown as HeadingComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Heading as any).displayName = 'Heading';
