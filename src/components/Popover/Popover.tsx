import React, { createContext, forwardRef, useContext, useEffect, useId, useRef } from 'react';
import type { ElementType, FocusEvent, MouseEvent, ReactNode, RefObject } from 'react';
import type { Placement } from '@floating-ui/dom';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { usePositioning } from '../../hooks/usePositioning';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import styles from './Popover.module.css';

export type PopoverTriggerMode = 'click' | 'hover';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  contentId: string;
  triggerMode: PopoverTriggerMode;
  scheduleClose: () => void;
  cancelScheduledClose: () => void;
}

const PopoverContext = createContext<PopoverContextValue | undefined>(undefined);

function usePopoverContext(part: string): PopoverContextValue {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error(`<Popover.${part}> must be used within <Popover>`);
  }
  return context;
}

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * `'click'` (default) toggles open on trigger click, like `Dropdown`.
   * `'hover'` opens on pointer hover or keyboard focus of the trigger, and
   * closes after `closeDelay` once neither the trigger nor the content has
   * hover/focus — for Tooltip/Hover Card style consumers.
   */
  triggerMode?: PopoverTriggerMode;
  /** Delay in ms before closing once hover/focus leaves. Only relevant when `triggerMode="hover"`. Defaults to 150. */
  closeDelay?: number;
  children: ReactNode;
}

function PopoverRoot({
  open,
  defaultOpen = false,
  onOpenChange,
  triggerMode = 'click',
  closeDelay = 150,
  children,
}: PopoverProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement>(null);
  const contentId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function cancelScheduledClose() {
    if (closeTimerRef.current !== undefined) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }

  function scheduleClose() {
    cancelScheduledClose();
    closeTimerRef.current = setTimeout(() => setIsOpen(false), closeDelay);
  }

  useEffect(() => cancelScheduledClose, []);

  return (
    <PopoverContext.Provider
      value={{
        open: isOpen,
        setOpen: setIsOpen,
        triggerRef,
        contentId,
        triggerMode,
        scheduleClose,
        cancelScheduledClose,
      }}
    >
      {children}
    </PopoverContext.Provider>
  );
}

export type PopoverTriggerProps<C extends ElementType = 'button'> =
  PolymorphicComponentPropWithRef<C>;

type PopoverTriggerComponent = <C extends ElementType = 'button'>(
  props: PopoverTriggerProps<C>,
) => React.ReactElement | null;

/** *Is* the clickable/hoverable element (default `button`), same convention as `Dropdown.Trigger` — see docs/SPEC.md's compound-component notes. */
const PopoverTrigger = forwardRef(function PopoverTrigger<C extends ElementType = 'button'>(
  {
    as,
    className,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    ...rest
  }: PopoverTriggerProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const { open, setOpen, triggerRef, contentId, triggerMode, scheduleClose, cancelScheduledClose } =
    usePopoverContext('Trigger');
  const Component = as || 'button';
  const isNativeButton = Component === 'button';

  function handleClick(event: MouseEvent) {
    if (triggerMode === 'click') setOpen(!open);
    onClick?.(event as never);
  }

  function handleMouseEnter(event: MouseEvent) {
    if (triggerMode === 'hover') {
      cancelScheduledClose();
      setOpen(true);
    }
    onMouseEnter?.(event as never);
  }

  function handleMouseLeave(event: MouseEvent) {
    if (triggerMode === 'hover') scheduleClose();
    onMouseLeave?.(event as never);
  }

  function handleFocus(event: FocusEvent) {
    if (triggerMode === 'hover') {
      cancelScheduledClose();
      setOpen(true);
    }
    onFocus?.(event as never);
  }

  function handleBlur(event: FocusEvent) {
    if (triggerMode === 'hover') scheduleClose();
    onBlur?.(event as never);
  }

  return (
    <Component
      ref={mergeRefs(ref, triggerRef)}
      {...(isNativeButton ? { type: 'button' } : {})}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={contentId}
      className={mergeClasses(styles.trigger, className)}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );
}) as unknown as PopoverTriggerComponent;

export interface PopoverContentProps {
  placement?: Placement;
  /**
   * No default — `Popover` is a low-level primitive with arbitrary
   * content, so the correct role (`"tooltip"`, `"listbox"`, `"menu"`,
   * `"dialog"`, ...) depends entirely on the consumer building on top of
   * it, not on `Popover` itself.
   */
  role?: string;
  children: ReactNode;
  className?: string;
}

function PopoverContent({
  placement = 'bottom-start',
  role,
  children,
  className,
}: PopoverContentProps) {
  const { open, setOpen, triggerRef, contentId, triggerMode, scheduleClose, cancelScheduledClose } =
    usePopoverContext('Content');
  const contentRef = useRef<HTMLDivElement>(null);
  const position = usePositioning(triggerRef, contentRef, { active: open, placement });

  useEscapeKey(() => setOpen(false), open);
  useClickOutside([contentRef, triggerRef], () => setOpen(false), open);

  function handleMouseEnter() {
    if (triggerMode === 'hover') cancelScheduledClose();
  }

  function handleMouseLeave() {
    if (triggerMode === 'hover') scheduleClose();
  }

  function handleFocus() {
    if (triggerMode === 'hover') cancelScheduledClose();
  }

  function handleBlur() {
    if (triggerMode === 'hover') scheduleClose();
  }

  if (!open) return null;

  return (
    <Portal>
      <div
        ref={contentRef}
        id={contentId}
        role={role}
        tabIndex={-1}
        className={mergeClasses(styles.content, className)}
        style={{ position: 'absolute', left: position.x, top: position.y }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>
    </Portal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(PopoverTrigger as any).displayName = 'Popover.Trigger';
PopoverContent.displayName = 'Popover.Content';

/**
 * Generalizes `Dropdown.Menu`'s trigger+panel+positioning+dismiss logic
 * (`usePositioning`, `useClickOutside`/`useEscapeKey`, `Portal`) into a
 * reusable primitive for later overlay components (Select, Combobox,
 * Tooltip, Hover Card, Context Menu — see docs/SPEC.md's Phase 4 notes),
 * with both click and hover/focus (with `closeDelay`) trigger modes.
 * Shipped `Dropdown` is untouched and does not use this — it's for new
 * consumers only, to avoid regression risk on shipped code.
 *
 * Deliberately does *not* manage focus (no focus trap, no auto-focus into
 * content): unlike `Dropdown.Menu`, which always contains `menuitem`s and
 * so can safely focus the first one, `Popover.Content` holds arbitrary
 * children — a `Tooltip` shouldn't steal focus at all, while a future
 * `Select` needs its own listbox-specific focus handling (`useRovingFocus`)
 * on top of this. Each consumer brings its own focus story; `Popover` only
 * handles positioning and dismissal.
 *
 * Compound component:
 * `<Popover><Popover.Trigger>...</Popover.Trigger><Popover.Content>...</Popover.Content></Popover>`.
 * Parts are also individually named-exported — see docs/SPEC.md.
 */
export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  displayName: 'Popover',
});

export { PopoverTrigger, PopoverContent };
