import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { ElementType, KeyboardEvent, MouseEvent, ReactNode, RefObject } from 'react';
import type { Placement } from '@floating-ui/dom';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { usePositioning } from '../../hooks/usePositioning';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { SparkleIcon } from '../AITriggerButton/AITriggerButton';
import type { AIActionStatus } from '../../hooks/useAIAction';
import type { MenuAISuggestItem, MenuAISuggestOptions } from '../Menu/Menu';
import styles from './Dropdown.module.css';

export type { MenuAISuggestItem, MenuAISuggestOptions } from '../Menu/Menu';

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  menuId: string;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

function useDropdownContext(part: string): DropdownContextValue {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error(`<Dropdown.${part}> must be used within <Dropdown>`);
  }
  return context;
}

export interface DropdownProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function DropdownRoot({ open, defaultOpen = false, onOpenChange, children }: DropdownProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement>(null);
  const menuId = useId();

  return (
    <DropdownContext.Provider value={{ open: isOpen, setOpen: setIsOpen, triggerRef, menuId }}>
      {children}
    </DropdownContext.Provider>
  );
}

export type DropdownTriggerProps<C extends ElementType = 'button'> =
  PolymorphicComponentPropWithRef<C>;

type DropdownTriggerComponent = <C extends ElementType = 'button'>(
  props: DropdownTriggerProps<C>,
) => React.ReactElement | null;

/**
 * *Is* the clickable element (default `button`) rather than wrapping a
 * separately-provided one — see docs/SPEC.md's compound-component
 * convention for why this avoids both `cloneElement` and the
 * generic-JSX-composition issues hit with Box/Flex.
 */
const DropdownTrigger = forwardRef(function DropdownTrigger<C extends ElementType = 'button'>(
  { as, className, onClick, ...rest }: DropdownTriggerProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const { open, setOpen, triggerRef, menuId } = useDropdownContext('Trigger');
  const Component = as || 'button';
  const isNativeButton = Component === 'button';

  return (
    <Component
      ref={mergeRefs(ref, triggerRef)}
      {...(isNativeButton ? { type: 'button' } : {})}
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={menuId}
      className={mergeClasses(styles.trigger, className)}
      onClick={(event: MouseEvent) => {
        setOpen(!open);
        onClick?.(event as never);
      }}
      {...rest}
    />
  );
}) as unknown as DropdownTriggerComponent;

export interface DropdownMenuProps {
  placement?: Placement;
  children: ReactNode;
  className?: string;
  /**
   * Adds a "Suggest with AI" item at the end of the menu. Off by default.
   * Same resolver shape as `Menu`'s `aiSuggest` — no shared AI primitive,
   * `resolve` is entirely consumer-owned. Resolved items render as real
   * `Dropdown.Item`s (closing the menu and refocusing the trigger on
   * select, same as any other item); the trigger item itself does not
   * close the menu, so results stay visible once resolved.
   */
  aiSuggest?: MenuAISuggestOptions;
}

function DropdownMenu({
  placement = 'bottom-start',
  children,
  className,
  aiSuggest,
}: DropdownMenuProps) {
  const { open, setOpen, triggerRef, menuId } = useDropdownContext('Menu');
  const menuRef = useRef<HTMLDivElement>(null);
  const position = usePositioning(triggerRef, menuRef, { active: open, placement });
  const [aiItems, setAiItems] = useState<MenuAISuggestItem[]>([]);
  const [aiStatus, setAiStatus] = useState<AIActionStatus>('idle');

  useEffect(() => {
    if (!open) {
      setAiItems([]);
      setAiStatus('idle');
    }
  }, [open]);

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

  useEscapeKey(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, open);

  useClickOutside([menuRef, triggerRef], () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const firstItem = menuRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not(:disabled)',
    );
    firstItem?.focus();
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Tab') {
      // Menus close on Tab rather than trapping it — the default browser
      // behavior (moving to the next element) is what's expected here,
      // unlike Dialog's modal focus trap.
      setOpen(false);
      return;
    }

    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'),
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number;
    switch (event.key) {
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + items.length) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    items[nextIndex]?.focus();
  }

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={menuRef}
        role="menu"
        id={menuId}
        tabIndex={-1}
        className={mergeClasses(styles.menu, className)}
        style={{ position: 'absolute', left: position.x, top: position.y }}
        onKeyDown={handleKeyDown}
      >
        {children}
        {aiSuggest && (
          <>
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className={mergeClasses(styles.item, styles.aiItem)}
              onClick={handleAISuggest}
            >
              <SparkleIcon />
              <span>
                {aiStatus === 'loading'
                  ? 'Thinking…'
                  : (aiSuggest.triggerLabel ?? 'Suggest with AI')}
              </span>
            </button>
            {aiStatus === 'error' && (
              <div role="alert" className={styles.aiError}>
                Couldn&apos;t get suggestions.
              </div>
            )}
            {aiItems.length > 0 && (
              <>
                <div className={styles.aiGroupHeading}>{aiSuggest.groupHeading ?? 'Suggested'}</div>
                {aiItems.map((item) => (
                  <DropdownItem key={item.id} onSelect={item.onSelect}>
                    {item.label}
                  </DropdownItem>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </Portal>
  );
}

export interface DropdownItemProps {
  onSelect?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

function DropdownItem({ onSelect, disabled = false, children, className }: DropdownItemProps) {
  const { setOpen, triggerRef } = useDropdownContext('Item');

  function handleSelect() {
    onSelect?.();
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      className={mergeClasses(styles.item, className)}
      onClick={handleSelect}
    >
      {children}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(DropdownTrigger as any).displayName = 'Dropdown.Trigger';
DropdownMenu.displayName = 'Dropdown.Menu';
DropdownItem.displayName = 'Dropdown.Item';

/**
 * Compound component: `<Dropdown><Dropdown.Trigger>...</Dropdown.Trigger><Dropdown.Menu><Dropdown.Item onSelect={...}>...</Dropdown.Item></Dropdown.Menu></Dropdown>`.
 * Parts are also individually named-exported — see docs/SPEC.md.
 */
export const Dropdown = Object.assign(DropdownRoot, {
  Trigger: DropdownTrigger,
  Menu: DropdownMenu,
  Item: DropdownItem,
  displayName: 'Dropdown',
});

export { DropdownTrigger, DropdownMenu, DropdownItem };
