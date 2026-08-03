import { cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
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
import { SparkleIcon } from '../AITriggerButton/AITriggerButton';
import type { AIActionStatus } from '../../hooks/useAIAction';
import styles from './Menu.module.css';

export interface MenuAISuggestItem {
  id: string;
  label: ReactNode;
  onSelect: () => void;
}

export interface MenuAISuggestOptions {
  /**
   * Resolves to real, executable items merged into the menu under a
   * "Suggested" heading. No shared AI primitive — entirely consumer-owned,
   * the same `CommandPalette`-resolver shape `Select`'s `aiSuggest` uses.
   * Only called when the trigger item is explicitly activated, not on
   * every render.
   */
  resolve: () => Promise<MenuAISuggestItem[]>;
  /** Label for the trigger item. Defaults to `'Suggest with AI'`. */
  triggerLabel?: ReactNode;
  /** Heading shown above the AI-resolved items. Defaults to `'Suggested'`. */
  groupHeading?: ReactNode;
}

export interface MenuOwnProps {
  /** `Menu.Item` elements. */
  children: ReactNode;
  /**
   * Adds a "Suggest with AI" item at the end of the menu. Off by default.
   * Activating it resolves extra items, merged in under a "Suggested"
   * heading and fully participating in the same roving-tabindex keyboard
   * navigation as every other item.
   */
  aiSuggest?: MenuAISuggestOptions;
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
export function Menu({ className, children, aiSuggest, ...rest }: MenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = flattenChildren(children).filter(isValidElement) as ReactElement<{
    disabled?: boolean;
  }>[];
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstEnabled = items.findIndex((item) => !item.props.disabled);
    return firstEnabled === -1 ? 0 : firstEnabled;
  });
  const [aiItems, setAiItems] = useState<MenuAISuggestItem[]>([]);
  const [aiStatus, setAiStatus] = useState<AIActionStatus>('idle');

  useEffect(() => {
    setAiItems([]);
    setAiStatus('idle');
    // Reset whenever the underlying resolver changes — a new `aiSuggest`
    // means stale resolved items no longer make sense to keep around.
  }, [aiSuggest]);

  async function handleAISuggest() {
    if (!aiSuggest) return;
    setAiStatus('loading');
    try {
      const resolved = await aiSuggest.resolve();
      setAiItems(resolved);
      setAiStatus('idle');
    } catch {
      setAiItems([]);
      setAiStatus('error');
    }
  }

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

  const regularCount = items.length;
  const nodes: ReactNode[] = items.map((child, index) =>
    cloneElement(child, {
      key: index,
      tabIndex: index === activeIndex ? 0 : -1,
      'data-menu-item': '',
    } as Partial<unknown>),
  );

  if (aiSuggest) {
    nodes.push(
      cloneElement(
        <MenuItem onSelect={handleAISuggest} className={styles.aiMenuItem}>
          <SparkleIcon />
          <span>
            {aiStatus === 'loading' ? 'Thinking…' : (aiSuggest.triggerLabel ?? 'Suggest with AI')}
          </span>
        </MenuItem>,
        {
          key: 'ai-trigger',
          tabIndex: regularCount === activeIndex ? 0 : -1,
          'data-menu-item': '',
        } as Partial<unknown>,
      ),
    );
    if (aiStatus === 'error') {
      nodes.push(
        <div key="ai-error" role="alert" className={styles.aiError}>
          Couldn&apos;t get suggestions.
        </div>,
      );
    }
    if (aiItems.length > 0) {
      nodes.push(
        <div key="ai-heading" className={styles.aiGroupHeading}>
          {aiSuggest.groupHeading ?? 'Suggested'}
        </div>,
      );
      aiItems.forEach((item, index) => {
        nodes.push(
          cloneElement(<MenuItem onSelect={item.onSelect}>{item.label}</MenuItem>, {
            key: `ai-item-${item.id}`,
            tabIndex: regularCount + 1 + index === activeIndex ? 0 : -1,
            'data-menu-item': '',
          } as Partial<unknown>),
        );
      });
    }
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
      {nodes}
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
