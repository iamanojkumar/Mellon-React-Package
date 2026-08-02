import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { Drawer } from '../Drawer/Drawer';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** Renders as a permanently in-flow `<nav>` panel (default) or, when `true`, as a `Drawer`-based overlay for a collapsed/mobile layout — pass this from the consumer's own responsive breakpoint logic (this library has no built-in media-query hook) to get "mobile collapse" behavior. */
  asDrawer?: boolean;
  /** Only meaningful when `asDrawer` is `true`. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Defaults to `'Sidebar'`. */
  'aria-label'?: string;
  /** `Sidebar.Item`/`Sidebar.Group` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Vertical nav panel. `asDrawer` is the Phase 16 "depends on `Drawer` for
 * mobile Sidebar collapse" requirement: rather than Sidebar owning its own
 * breakpoint detection (nothing else in this library reads viewport size in
 * JS either — CSS media queries handle that everywhere else), it delegates
 * entirely to `Drawer` (`placement="left"`) when `asDrawer` is `true`,
 * leaving the actual mobile/desktop decision to the consumer. This is the
 * same "thin wrapper" shape as `TimePicker`-over-`Select` (CLAUDE.md), just
 * applied conditionally instead of unconditionally.
 */
function SidebarRoot({
  asDrawer = false,
  open,
  defaultOpen = false,
  onOpenChange,
  'aria-label': ariaLabel = 'Sidebar',
  children,
  className,
}: SidebarProps) {
  if (asDrawer) {
    return (
      <Drawer
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={onOpenChange}
        placement="left"
        size="sm"
        aria-label={ariaLabel}
        className={className}
      >
        {/* No nested `<nav>` here (unlike the in-flow branch below): the
            Drawer panel is already `role="dialog" aria-label={ariaLabel}` —
            a second landmark with the same name would just be a confusing
            duplicate announcement, not additional information. */}
        <ul className={styles.list}>{children}</ul>
      </Drawer>
    );
  }

  return (
    <nav aria-label={ariaLabel} className={mergeClasses(styles.sidebar, className)}>
      <ul className={styles.list}>{children}</ul>
    </nav>
  );
}

export interface SidebarItemOwnProps {
  active?: boolean;
  icon?: ReactNode;
  badge?: ReactNode;
}

export type SidebarItemProps<C extends ElementType = 'a'> = PolymorphicComponentPropWithRef<
  C,
  SidebarItemOwnProps
>;

type SidebarItemComponent = <C extends ElementType = 'a'>(
  props: SidebarItemProps<C>,
) => React.ReactElement | null;

/** Fixed `<li>` wrapper around the polymorphic (default `<a>`) interactive element — same "structural wrapper + polymorphic child" split `ButtonGroup` uses, so `as` never has to also mean "and also be a `<li>`". */
const SidebarItem = forwardRef(function SidebarItem<C extends ElementType = 'a'>(
  { as, className, active = false, icon, badge, children, ...rest }: SidebarItemProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as ?? 'a';

  return (
    <li className={styles.itemWrapper}>
      <Component
        ref={ref}
        className={mergeClasses(styles.item, className)}
        aria-current={active ? 'page' : undefined}
        data-active={active || undefined}
        {...rest}
      >
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
        <span className={styles.label}>{children}</span>
        {badge && <span className={styles.badge}>{badge}</span>}
      </Component>
    </li>
  );
}) as unknown as SidebarItemComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(SidebarItem as any).displayName = 'Sidebar.Item';

export interface SidebarGroupProps {
  /** Section heading shown above the grouped items. */
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Labelled section of items — an `<li>` containing its own `label` and a nested `<ul>`, valid nesting for a list of items grouped under a heading. */
function SidebarGroup({ label, children, className }: SidebarGroupProps) {
  return (
    <li className={mergeClasses(styles.group, className)}>
      <span className={styles.groupLabel}>{label}</span>
      <ul className={styles.groupList}>{children}</ul>
    </li>
  );
}

SidebarGroup.displayName = 'Sidebar.Group';

/**
 * Compound component: `<Sidebar><Sidebar.Item href="/">Dashboard</Sidebar.Item></Sidebar>`,
 * optionally grouped via `<Sidebar.Group label="Main">...</Sidebar.Group>`.
 * Parts are also individually named-exported — see docs/SPEC.md for the
 * compound-component convention.
 */
export const Sidebar = Object.assign(SidebarRoot, {
  Item: SidebarItem,
  Group: SidebarGroup,
  displayName: 'Sidebar',
});

export { SidebarItem, SidebarGroup };
