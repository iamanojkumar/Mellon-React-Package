import React, { forwardRef } from 'react';
import type { ElementType, ForwardRefRenderFunction, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import navigationRailStyles from '../NavigationRail/NavigationRail.module.css';
import styles from './BottomNavigation.module.css';

export interface BottomNavigationProps {
  /** Defaults to `'Bottom Navigation'`. */
  'aria-label'?: string;
  /** `BottomNavigation.Item` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Fixed-bottom horizontal icon+label tab bar — the mobile counterpart to
 * `NavigationRail`, sharing the exact same per-item shape (icon on top,
 * short label below, `active`/`badge`) since that's genuinely identical
 * between the two patterns; only the *container* orientation and
 * positioning differ. Reuses `NavigationRail.module.css`'s self-contained
 * `.item`/`.iconWrapper`/`.icon`/`.badge`/`.label` rules directly (see
 * docs/SPEC.md's cross-component CSS reuse note) rather than duplicating
 * them, adding only its own `flex: 1` so items divide the bar's width
 * evenly instead of `NavigationRail`'s fixed 80px column. Kept a separate
 * component from
 * `NavigationRail` rather than one `orientation`-prop component (the way
 * `Timeline` unifies vertical/horizontal) because docs/SPEC.md's Component
 * Inventory lists them as two distinct build items, not one covering the
 * other. Same "ordinary tabbable items + `useRovingFocus` layered on top,
 * no roving-tabindex Tab-stop restriction" reasoning as `NavigationRail` —
 * see its own doc comment.
 */
function BottomNavigationRoot({
  'aria-label': ariaLabel = 'Bottom Navigation',
  children,
  className,
}: BottomNavigationProps) {
  const handleKeyDown = useRovingFocus({
    itemSelector: '[data-bottom-navigation-item]',
    orientation: 'horizontal',
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown here only intercepts Arrow/Home/End to move focus among the nav's own focusable children (useRovingFocus); it adds no interaction semantics to the <nav> landmark itself
    <nav
      aria-label={ariaLabel}
      className={mergeClasses(styles.bottomNav, className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </nav>
  );
}

export interface BottomNavigationItemOwnProps {
  active?: boolean;
  /** Decorative — the visible label (`children`) carries the accessible name, same convention as `NavigationRail.Item`. */
  icon: ReactNode;
  badge?: ReactNode;
}

export type BottomNavigationItemProps<C extends ElementType = 'a'> =
  PolymorphicComponentPropWithRef<C, BottomNavigationItemOwnProps>;

type BottomNavigationItemComponent = <C extends ElementType = 'a'>(
  props: BottomNavigationItemProps<C>,
) => React.ReactElement | null;

// `icon` is required on BottomNavigationItemOwnProps, which trips up
// forwardRef's generic type-checking — see `NavigationRail.Item`/`Heading`/
// `IconButton` for why the render function is cast below instead of passed
// directly to `forwardRef`.
function BottomNavigationItemRender<C extends ElementType = 'a'>(
  { as, className, active = false, icon, badge, children, ...rest }: BottomNavigationItemProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as ?? 'a';

  return (
    <Component
      ref={ref}
      data-bottom-navigation-item=""
      className={mergeClasses(navigationRailStyles.item, styles.item, className)}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
      {...rest}
    >
      <span className={navigationRailStyles.iconWrapper}>
        <span className={navigationRailStyles.icon} aria-hidden="true">
          {icon}
        </span>
        {badge && <span className={navigationRailStyles.badge}>{badge}</span>}
      </span>
      {children !== undefined && <span className={navigationRailStyles.label}>{children}</span>}
    </Component>
  );
}

const BottomNavigationItem = forwardRef(
  BottomNavigationItemRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<BottomNavigationItemProps<ElementType>, 'ref'>
  >,
) as unknown as BottomNavigationItemComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BottomNavigationItem as any).displayName = 'BottomNavigation.Item';

/**
 * Compound component: `<BottomNavigation><BottomNavigation.Item icon={...} active>Home</BottomNavigation.Item></BottomNavigation>`.
 * `BottomNavigation.Item` is also individually named-exported — see
 * docs/SPEC.md for the compound-component convention.
 */
export const BottomNavigation = Object.assign(BottomNavigationRoot, {
  Item: BottomNavigationItem,
  displayName: 'BottomNavigation',
});

export { BottomNavigationItem };
