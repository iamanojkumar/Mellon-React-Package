import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './AspectRatio.module.css';

export interface AspectRatioOwnProps {
  /** Width divided by height, e.g. `16 / 9`. Defaults to `1` (square). */
  ratio?: number;
}

export type AspectRatioProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  AspectRatioOwnProps
>;

type AspectRatioComponent = <C extends ElementType = 'div'>(
  props: AspectRatioProps<C>,
) => React.ReactElement | null;

/**
 * Constrains its content to a fixed width:height ratio via the native CSS
 * `aspect-ratio` property — no padding-box percentage-hack needed. A direct
 * `<img>`/`<video>` child is stretched to fill and cropped via
 * `object-fit: cover`; wrap other content types yourself if `cover` isn't
 * what you want.
 */
export const AspectRatio = forwardRef(function AspectRatio<C extends ElementType = 'div'>(
  { as, className, style, ratio = 1, ...rest }: AspectRatioProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.aspectRatio, className)}
      style={{ aspectRatio: String(ratio), ...style }}
      {...rest}
    />
  );
}) as unknown as AspectRatioComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(AspectRatio as any).displayName = 'AspectRatio';
