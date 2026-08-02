import { mergeClasses } from '../../utilities/mergeClasses';
import type { ReactNode } from 'react';
import styles from './Navbar.module.css';

export interface NavbarProps {
  /** Pins the bar to the top of its nearest scroll container (`position: sticky; top: 0`). Defaults to `false`. */
  sticky?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Top app bar layout shell: `<header>` containing `Navbar.Brand`/
 * `Navbar.Content`/`Navbar.Actions` as flex regions — purely presentational
 * (no state, no compound context), the same shape `Dialog`'s
 * `Header`/`Body`/`Footer` parts use. Deliberately has no built-in mobile
 * hamburger/drawer: composing a `Navbar.Actions`-slotted `IconButton` with
 * a separately-rendered `Sidebar`/`Drawer` is the consumer's call (what
 * goes in the drawer is app-specific), not something this shell should
 * assume.
 */
function NavbarRoot({ sticky = false, children, className }: NavbarProps) {
  return (
    <header className={mergeClasses(styles.navbar, className)} data-sticky={sticky || undefined}>
      {children}
    </header>
  );
}

export interface NavbarPartProps {
  children: ReactNode;
  className?: string;
}

/** Left-most, non-shrinking slot — typically a logo/wordmark. */
function NavbarBrand({ children, className }: NavbarPartProps) {
  return <div className={mergeClasses(styles.brand, className)}>{children}</div>;
}

/** The primary navigation landmark (`<nav aria-label="Main">`) — grows to fill remaining space. */
function NavbarContent({ children, className }: NavbarPartProps) {
  return (
    <nav aria-label="Main" className={mergeClasses(styles.content, className)}>
      {children}
    </nav>
  );
}

/** Right-most, non-shrinking slot — search, notifications, avatar, etc. */
function NavbarActions({ children, className }: NavbarPartProps) {
  return <div className={mergeClasses(styles.actions, className)}>{children}</div>;
}

NavbarBrand.displayName = 'Navbar.Brand';
NavbarContent.displayName = 'Navbar.Content';
NavbarActions.displayName = 'Navbar.Actions';

/**
 * Compound component: `<Navbar><Navbar.Brand>...</Navbar.Brand><Navbar.Content>...</Navbar.Content><Navbar.Actions>...</Navbar.Actions></Navbar>`.
 * Parts are also individually named-exported — see docs/SPEC.md for the
 * compound-component convention.
 */
export const Navbar = Object.assign(NavbarRoot, {
  Brand: NavbarBrand,
  Content: NavbarContent,
  Actions: NavbarActions,
  displayName: 'Navbar',
});

export { NavbarBrand, NavbarContent, NavbarActions };
