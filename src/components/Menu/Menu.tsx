import { cloneElement, isValidElement, useRef, useState } from 'react';
import type {
  ComponentPropsWithoutRef,
  FocusEvent,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { flattenChildren } from '../../utilities/flattenChildren';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Menu.module.css';

export interface MenuOwnProps {
  /** `Menu.Item` elements. */
  children: ReactNode;
}

export type MenuProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & MenuOwnProps;

/**
 * Standalone `role="menu"`/`role="menuitem"` list with real roving
 * tabindex via `useRovingFocus` — usable statically (e.g. in a future
 * Sidebar/Navbar) or wrapped by an overlay (`Popover.Content`, a future
 * Context Menu), unlike `Dropdown.Menu`, which hand-rolls its own
 * `Portal`+positioning+dismissal and is left untouched (see docs/SPEC.md's
 * Phase 4 notes on why). `Dropdown.Menu` also gives every item a
 * permanent `tabIndex={-1}` and moves focus only via `.focus()` calls,
 * which works there because Tab always closes that menu; `Menu` instead
 * keeps exactly one item as a real, stable Tab stop, since a *statically*
 * displayed menu has no such "Tab closes it" escape hatch and must be
 * reachable by normal sequential Tab navigation like any other widget.
 *
 * Deliberately does **not** auto-focus an item on mount — unlike
 * `Dropdown.Menu`'s open-focuses-first-item behavior, `Menu` doesn't know
 * whether it's being statically rendered (where stealing focus on mount
 * would be disruptive) or freshly mounted inside an overlay (where it
 * usually should). Consumers that want "focus first item on open" handle
 * it themselves — see the future Context Menu, which queries for
 * `[role="menuitem"]` the same way `Dropdown.Menu` already does.
 */
export function Menu({ className, children, ...rest }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = flattenChildren(children).filter(isValidElement) as ReactElement<{
    disabled?: boolean;
  }>[];
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstEnabled = items.findIndex((item) => !item.props.disabled);
    return firstEnabled === -1 ? 0 : firstEnabled;
  });

  const handleRovingKeyDown = useRovingFocus({
    itemSelector: '[data-menu-item]:not([aria-disabled="true"])',
    orientation: 'vertical',
  });

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!target.hasAttribute('data-menu-item')) return;
    const all = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[data-menu-item]') ?? [],
    );
    const index = all.indexOf(target);
    if (index !== -1) setActiveIndex(index);
  }

  return (
    <div
      ref={containerRef}
      role="menu"
      tabIndex={-1}
      className={mergeClasses(styles.menu, className)}
      onKeyDown={handleRovingKeyDown}
      onFocus={handleFocus}
      {...rest}
    >
      {items.map((child, index) =>
        cloneElement(child, {
          key: index,
          tabIndex: index === activeIndex ? 0 : -1,
          'data-menu-item': '',
        } as Partial<unknown>),
      )}
    </div>
  );
}

Menu.displayName = 'Menu';

export interface MenuItemOwnProps {
  onSelect?: () => void;
  disabled?: boolean;
}

export type MenuItemProps = ComponentPropsWithoutRef<'div'> & MenuItemOwnProps;

/** A single `Menu` entry. Handles its own Enter/Space activation directly (it's a `<div>`, not a `<button>`, so it doesn't get that translation for free) — `Menu`'s own keydown handler only covers Arrow/Home/End navigation. */
export function MenuItem({
  onSelect,
  disabled = false,
  tabIndex = -1,
  children,
  className,
  ...rest
}: MenuItemProps) {
  function activate() {
    if (disabled) return;
    onSelect?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate();
    }
  }

  return (
    <div
      role="menuitem"
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      className={mergeClasses(styles.item, className)}
      onClick={activate}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {children}
    </div>
  );
}

MenuItem.displayName = 'Menu.Item';
