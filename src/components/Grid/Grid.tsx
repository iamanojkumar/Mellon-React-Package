import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import { resolveSpacingStyle } from '../../utilities/spacingProps';
import type { SpacingProps } from '../../utilities/spacingProps';
import styles from './Grid.module.css';

export type GridAutoFlow = 'row' | 'column' | 'dense' | 'row dense' | 'column dense';
export type GridTemplate = number | (string & {});

function resolveTemplate(value: GridTemplate | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `repeat(${value}, 1fr)`;
  return value;
}

export interface GridOwnProps extends SpacingProps {
  /** Number of equal-width columns, or a raw `grid-template-columns` value. */
  columns?: GridTemplate;
  /** Number of equal-height rows, or a raw `grid-template-rows` value. */
  rows?: GridTemplate;
  gap?: SpaceValue;
  columnGap?: SpaceValue;
  rowGap?: SpaceValue;
  autoFlow?: GridAutoFlow;
}

export type GridProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  GridOwnProps
>;

type GridComponent = <C extends ElementType = 'div'>(
  props: GridProps<C>,
) => React.ReactElement | null;

/**
 * `display: grid` layout primitive. Composes the same spacing props as
 * `Box` (via the shared `resolveSpacingStyle`) plus grid-specific props —
 * see docs/SPEC.md "Styling Strategy".
 */
export const Grid = forwardRef(function Grid<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    columns,
    rows,
    gap,
    columnGap,
    rowGap,
    autoFlow,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    ...rest
  }: GridProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const gridStyle: React.CSSProperties = {
    ...resolveSpacingStyle({ p, px, py, pt, pr, pb, pl, m, mx, my, mt, mr, mb, ml }),
    ...(columns !== undefined && { gridTemplateColumns: resolveTemplate(columns) }),
    ...(rows !== undefined && { gridTemplateRows: resolveTemplate(rows) }),
    ...(gap !== undefined && { gap: resolveSpace(gap) }),
    ...(columnGap !== undefined && { columnGap: resolveSpace(columnGap) }),
    ...(rowGap !== undefined && { rowGap: resolveSpace(rowGap) }),
    ...(autoFlow !== undefined && { gridAutoFlow: autoFlow }),
    ...style,
  };

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.grid, className)}
      style={gridStyle}
      {...rest}
    />
  );
}) as unknown as GridComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Grid as any).displayName = 'Grid';
