import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AlertVariantIcon } from '../Alert/Alert';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Tag.module.css';

export type TagColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

/** Same split as `Badge` — only these three make a semantic status claim. */
export type TagStatusColor = Extract<TagColor, 'success' | 'warning' | 'danger'>;

const STATUS_COLORS: readonly TagColor[] = ['success', 'warning', 'danger'];

function isStatusColor(color: TagColor): color is TagStatusColor {
  return STATUS_COLORS.includes(color);
}

export interface TagOwnProps {
  color?: TagColor;
  /**
   * Leading glyph. Defaults to `AlertVariantIcon` for the three status colors
   * and to nothing for `neutral`/`brand`. Pass `false` only when the tag's own
   * text already names the status — that also suppresses the visually-hidden
   * status word. See `Badge`'s `icon` prop for the full rationale.
   */
  icon?: ReactNode | false;
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
  { as, className, color = 'neutral', icon, children, ...rest }: TagProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';

  const isStatus = isStatusColor(color);
  const suppressed = icon === false;

  let resolvedIcon: ReactNode = null;
  if (!suppressed) {
    resolvedIcon = icon ?? (isStatus ? <AlertVariantIcon variant={color} /> : null);
  }

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.tag, className)}
      data-color={color}
      data-has-icon={resolvedIcon ? '' : undefined}
      {...rest}
    >
      {resolvedIcon}
      {isStatus && !suppressed ? <VisuallyHidden>{color}</VisuallyHidden> : null}
      {children}
    </Component>
  );
}) as unknown as TagComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Tag as any).displayName = 'Tag';
