import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import styles from './List.module.css';

export interface ListOwnProps {
  /** Renders as `<ol>` instead of `<ul>` (ignored if `as` is set explicitly). Defaults to `false`. */
  ordered?: boolean;
  /** Gap between items. Defaults to `xs`. */
  spacing?: SpaceValue;
  /** Hides the browser's default marker (bullet/number). Defaults to `false`. */
  unstyled?: boolean;
}

export type ListProps<C extends ElementType = 'ul'> = PolymorphicComponentPropWithRef<
  C,
  ListOwnProps
>;

type ListComponent = <C extends ElementType = 'ul'>(
  props: ListProps<C>,
) => React.ReactElement | null;

/** `<ul>`/`<ol>` wrapper with token-driven item spacing. Pair with `ListItem`. */
export const List = forwardRef(function List<C extends ElementType = 'ul'>(
  {
    as,
    className,
    style,
    ordered = false,
    spacing = 'xs',
    unstyled = false,
    ...rest
  }: ListProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as ?? (ordered ? 'ol' : 'ul');

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.list, className)}
      style={{ gap: resolveSpace(spacing), ...style }}
      data-unstyled={unstyled || undefined}
      {...rest}
    />
  );
}) as unknown as ListComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(List as any).displayName = 'List';
