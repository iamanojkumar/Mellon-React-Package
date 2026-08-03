import { cloneElement, isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, ReactElement, ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { Menu } from '../Menu/Menu';
import type { MenuAISuggestOptions } from '../Menu/Menu';
import { usePositioning } from '../../hooks/usePositioning';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { flattenChildren } from '../../utilities/flattenChildren';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ContextMenu.module.css';

export type { MenuAISuggestItem, MenuAISuggestOptions } from '../Menu/Menu';

export interface ContextMenuProps {
  /** The area that responds to right-click. */
  children: ReactNode;
  /** `Menu.Item` elements. Each one's `onSelect` is wrapped to also close the menu — a consumer's own `onSelect` doesn't need to do that itself. */
  menu: ReactNode;
  disabled?: boolean;
  /** Accessible label for the menu region. Defaults to "Context menu". */
  menuLabel?: string;
  className?: string;
  menuClassName?: string;
  /**
   * Forwarded to the internal `Menu`'s own `aiSuggest` — see `Menu`'s doc
   * comment for the shape. Resolved items' `onSelect` gets the same
   * "also close the menu" wrapping every other item already gets, so
   * consumers don't need to close it themselves.
   */
  aiSuggest?: MenuAISuggestOptions;
}

/**
 * Opens `Menu` at the pointer's coordinates on right-click, instead of
 * relative to a trigger element — the reason `usePositioning` gained
 * `PositioningReference`/virtual-element support in Phase 4
 * (`src/hooks/usePositioning.ts`), unused by any shipped component until
 * now. Reuses `Menu`/`MenuItem` for the list (roving-tabindex keyboard
 * nav, `role="menu"`/`"menuitem"`) and `Portal`/`useClickOutside`/
 * `useEscapeKey` for the overlay mechanics — the same pieces `Dropdown`
 * and `Popover` are built from.
 *
 * No controlled `open`/`onOpenChange` API: unlike a click- or
 * hover-triggered overlay, a context menu's very existence is defined by
 * *where* the triggering gesture happened, which isn't something an
 * external controller can supply meaningfully — right-clicking again
 * while already open simply repositions it at the new point rather than
 * toggling it closed.
 */
export function ContextMenu({
  children,
  menu,
  disabled = false,
  menuLabel = 'Context menu',
  className,
  menuClassName,
  aiSuggest,
}: ContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [clickPoint, setClickPoint] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Memoized on the coordinates, not recreated every render: `usePositioning`
  // depends on this object's identity, and a fresh object literal here would
  // tear down and re-subscribe its `autoUpdate` on every render — including
  // the renders `autoUpdate` itself triggers via `setPosition`, which would
  // free-run in a tight reactive loop (confirmed live: 700+ `ResizeObserver
  // .observe` calls within 500ms of opening, eventually starving the tab).
  const virtualReference = useMemo(
    () => ({
      getBoundingClientRect: () => new DOMRect(clickPoint.x, clickPoint.y, 0, 0),
    }),
    [clickPoint.x, clickPoint.y],
  );

  const position = usePositioning(virtualReference, panelRef, {
    active: isOpen,
    placement: 'bottom-start',
  });

  useEscapeKey(() => setIsOpen(false), isOpen);
  useClickOutside([panelRef], () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (!isOpen) return;
    panelRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
      ?.focus();
  }, [isOpen]);

  function handleContextMenu(event: ReactMouseEvent) {
    if (disabled) return;
    event.preventDefault();
    setClickPoint({ x: event.clientX, y: event.clientY });
    setIsOpen(true);
  }

  // `flattenChildren`, not `Children.map`/`Children.toArray` — neither
  // built-in unwraps a literal `<>...</>` fragment (the natural way to
  // author `menu`'s multiple `MenuItem`s), so cloning over them directly
  // would silently target the fragment wrapper instead of each item.
  const wrappedMenu = flattenChildren(menu).map((child) => {
    if (!isValidElement<{ onSelect?: () => void }>(child)) return child;
    return cloneElement(child as ReactElement<{ onSelect?: () => void }>, {
      onSelect: () => {
        child.props.onSelect?.();
        setIsOpen(false);
      },
    });
  });

  // Same "also close the menu" wrapping `wrappedMenu` gives every static
  // item, applied to whatever `aiSuggest.resolve` returns.
  const wrappedAiSuggest: MenuAISuggestOptions | undefined = aiSuggest && {
    ...aiSuggest,
    resolve: async () => {
      const resolved = await aiSuggest.resolve();
      return resolved.map((item) => ({
        ...item,
        onSelect: () => {
          item.onSelect();
          setIsOpen(false);
        },
      }));
    },
  };

  return (
    <>
      <div onContextMenu={handleContextMenu} className={className}>
        {children}
      </div>
      {isOpen && (
        <Portal>
          <div
            ref={panelRef}
            className={mergeClasses(styles.panel, menuClassName)}
            style={{ position: 'absolute', left: position.x, top: position.y }}
          >
            <Menu aria-label={menuLabel} aiSuggest={wrappedAiSuggest}>
              {wrappedMenu}
            </Menu>
          </div>
        </Portal>
      )}
    </>
  );
}

ContextMenu.displayName = 'ContextMenu';
