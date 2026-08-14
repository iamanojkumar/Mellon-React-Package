import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AlertVariantIcon } from '../Alert/Alert';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './Badge.module.css';

export type BadgeColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
export type BadgeVariant = 'solid' | 'subtle';

/**
 * The colors that make a *semantic status claim*, as opposed to `neutral`/
 * `brand` which are presentational. Only these get the automatic icon +
 * screen-reader label — see the `icon` prop.
 */
export type BadgeStatusColor = Extract<BadgeColor, 'success' | 'warning' | 'danger'>;

const STATUS_COLORS: readonly BadgeColor[] = ['success', 'warning', 'danger'];

function isStatusColor(color: BadgeColor): color is BadgeStatusColor {
  return STATUS_COLORS.includes(color);
}

export interface BadgeOwnProps {
  color?: BadgeColor;
  variant?: BadgeVariant;
  /**
   * Leading glyph. Defaults to `AlertVariantIcon` for the three status
   * colors and to nothing for `neutral`/`brand`.
   *
   * Pass `false` **only** when the badge's own text already names the status
   * (e.g. `<Badge color="danger">Failed</Badge>`) — that also suppresses the
   * visually-hidden status word. Status color must never be the sole carrier
   * of meaning: red and green are the same color under deuteranopia, so a
   * color-only badge is unreadable for ~8% of men.
   */
  icon?: ReactNode | false;
}

export type BadgeProps<C extends ElementType = 'span'> = PolymorphicComponentPropWithRef<
  C,
  BadgeOwnProps
>;

type BadgeComponent = <C extends ElementType = 'span'>(
  props: BadgeProps<C>,
) => React.ReactElement | null;

/**
 * Small status/count pill (e.g. "New", "3", "Beta") — not interactive or
 * removable, unlike `Chip`.
 *
 * A status `color` always ships a second, non-color channel: a visible icon
 * for sighted users who can't separate the hues, and a visually-hidden status
 * word for screen readers, which get no color at all. See `docs/TOKEN_AUDIT.md`
 * Part F — the Foundation's status palette is validated on the explicit
 * guarantee that consumers do this.
 */
export const Badge = forwardRef(function Badge<C extends ElementType = 'span'>(
  { as, className, color = 'neutral', variant = 'subtle', icon, children, ...rest }: BadgeProps<C>,
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
      className={mergeClasses(styles.badge, className)}
      data-color={color}
      data-variant={variant}
      data-has-icon={resolvedIcon ? '' : undefined}
      {...rest}
    >
      {resolvedIcon}
      {isStatus && !suppressed ? <VisuallyHidden>{color}</VisuallyHidden> : null}
      {children}
    </Component>
  );
}) as unknown as BadgeComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Badge as any).displayName = 'Badge';
