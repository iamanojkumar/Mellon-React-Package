import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './Container.module.css';

export type ContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ContainerOwnProps {
  maxWidth?: ContainerMaxWidth;
  /** Horizontal padding. Defaults to `md`. */
  paddingX?: SpaceValue;
}

export type ContainerProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  ContainerOwnProps
>;

type ContainerComponent = <C extends ElementType = 'div'>(
  props: ContainerProps<C>,
) => React.ReactElement | null;

/**
 * Centers content horizontally with a capped `max-width` and horizontal
 * padding — the standard page/section width wrapper. `maxWidth`'s scale is
 * its own (breakpoint-like widths, not part of the `--ds-space-*` scale),
 * same reasoning as fixed component dimensions elsewhere (see docs/SPEC.md's
 * DatePicker notes) — only `paddingX` draws from the spacing tokens.
 */
export const Container = forwardRef(function Container<C extends ElementType = 'div'>(
  { as, className, style, maxWidth = 'lg', paddingX = 'md', ...rest }: ContainerProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const containerStyle: React.CSSProperties = {
    paddingInline: resolveSpace(paddingX),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.container, className)}
      style={containerStyle}
      data-max-width={maxWidth}
      {...rest}
    />
  );
}) as unknown as ContainerComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Container as any).displayName = 'Container';
