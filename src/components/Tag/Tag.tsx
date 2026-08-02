import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Tag.module.css';

export type TagColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface TagOwnProps {
  color?: TagColor;
}

export type TagProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  TagOwnProps
>;

type TagComponent = <C extends ElementType = 'span'>(
  props: TagProps<C>,
) => React.ReactElement | null;

/**
 * Static categorization/metadata label (e.g. content tags) — outlined
 * rather than filled to read as a lighter-weight annotation than `Badge`
 * (status) or `Chip` (removable, interactive). Polymorphic so it can
 * render as a link (`as="a"`) for a clickable tag-filter use case, without
 * a built-in remove action.
 */
export const Tag = forwardRef(function Tag<C extends ElementType = 'span'>(
  { as, className, color = 'neutral', ...rest }: TagProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.tag, className)}
      data-color={color}
      {...rest}
    />
  );
}) as unknown as TagComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Tag as any).displayName = 'Tag';
