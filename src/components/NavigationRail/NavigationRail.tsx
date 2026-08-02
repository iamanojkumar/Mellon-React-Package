import React, { forwardRef } from 'react';
import type { ElementType, ForwardRefRenderFunction, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './NavigationRail.module.css';

export interface NavigationRailProps {
  /** Defaults to `'Navigation'`. */
  'aria-label'?: string;
  /** `NavigationRail.Item` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Compact vertical icon+label nav strip (Material's "Navigation Rail"
 * pattern). Unlike `Sidebar`, items need no shared context — each is an
 * independent destination the consumer marks `active` itself — so, like
 * `Accordion`, arrow-key traversal (`useRovingFocus`, vertical) is layered
 * on top of ordinary tabbable elements via an `onKeyDown` on the root and a
 * `data-navigation-rail-item` selector, without constraining `tabIndex` /
 * Tab-stop count the way a true roving-tabindex widget (`Tabs`) would —
 * each item stays individually reachable by Tab, which is correct here
 * since these are page destinations, not one composite control.
 */
function NavigationRailRoot({
  'aria-label': ariaLabel = 'Navigation',
  children,
  className,
}: NavigationRailProps) {
  const handleKeyDown = useRovingFocus({
    itemSelector: '[data-navigation-rail-item]',
    orientation: 'vertical',
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown here only intercepts Arrow/Home/End to move focus among the nav's own focusable children (useRovingFocus); it adds no interaction semantics to the <nav> landmark itself
    <nav
      aria-label={ariaLabel}
      className={mergeClasses(styles.rail, className)}
      onKeyDown={handleKeyDown}
    >
      {children}
    </nav>
  );
}

export interface NavigationRailItemOwnProps {
  active?: boolean;
  /** Decorative — the visible label (`children`) carries the accessible name, same convention as `Sidebar.Item`. */
  icon: ReactNode;
  badge?: ReactNode;
}

export type NavigationRailItemProps<C extends ElementType = 'a'> = PolymorphicComponentPropWithRef<
  C,
  NavigationRailItemOwnProps
>;

type NavigationRailItemComponent = <C extends ElementType = 'a'>(
  props: NavigationRailItemProps<C>,
) => React.ReactElement | null;

// `icon` is required on NavigationRailItemOwnProps, which trips up
// forwardRef's generic type-checking the same way `level` does on
// `Heading`/`aria-label` does on `IconButton` — see those components for
// why the render function is cast below instead of passed directly to
// `forwardRef`.
function NavigationRailItemRender<C extends ElementType = 'a'>(
  { as, className, active = false, icon, badge, children, ...rest }: NavigationRailItemProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as ?? 'a';

  return (
    <Component
      ref={ref}
      data-navigation-rail-item=""
      className={mergeClasses(styles.item, className)}
      aria-current={active ? 'page' : undefined}
      data-active={active || undefined}
      {...rest}
    >
      <span className={styles.iconWrapper}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </span>
      {children !== undefined && <span className={styles.label}>{children}</span>}
    </Component>
  );
}

const NavigationRailItem = forwardRef(
  NavigationRailItemRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<NavigationRailItemProps<ElementType>, 'ref'>
  >,
) as unknown as NavigationRailItemComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(NavigationRailItem as any).displayName = 'NavigationRail.Item';

/**
 * Compound component: `<NavigationRail><NavigationRail.Item icon={...} active>Home</NavigationRail.Item></NavigationRail>`.
 * `NavigationRail.Item` is also individually named-exported — see
 * docs/SPEC.md for the compound-component convention.
 */
export const NavigationRail = Object.assign(NavigationRailRoot, {
  Item: NavigationRailItem,
  displayName: 'NavigationRail',
});

export { NavigationRailItem };
