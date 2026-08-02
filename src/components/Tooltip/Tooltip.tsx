import { cloneElement, useEffect, useId, useRef } from 'react';
import type { FocusEvent, MouseEvent, ReactElement, ReactNode, Ref } from 'react';
import type { Placement } from '@floating-ui/dom';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { usePositioning } from '../../hooks/usePositioning';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** The tooltip's supplementary text/content. */
  content: ReactNode;
  /** The single trigger element — cloned to attach hover/focus handlers, a ref, and `aria-describedby`, rather than rendered inside an extra wrapper element. */
  children: ReactElement;
  placement?: Placement;
  /** Delay in ms before closing once hover/focus leaves (both the trigger and, if the pointer moves there, the tooltip content itself). Defaults to 150. */
  closeDelay?: number;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Not built on `Popover` (unlike `HoverCard`), despite both being
 * hover/focus-triggered: `Popover.Trigger` hardcodes `aria-haspopup`/
 * `aria-expanded`/`aria-controls`, which is the *popup* pattern — correct
 * for a hover card (a popup preview) but wrong for a tooltip, whose
 * correct wiring is `aria-describedby` on the trigger pointing at
 * `role="tooltip"` content, with no `aria-expanded`/`aria-haspopup` at
 * all. Reuses `Popover`'s underlying pieces directly instead
 * (`usePositioning`, `useEscapeKey`, `useControllableState`, the same
 * open/close-with-delay timer) to stay correct rather than forcing it
 * through `Popover.Trigger`'s popup semantics.
 *
 * Clones its single `children` element (adding a ref, hover/focus
 * handlers, and `aria-describedby`) instead of wrapping it in a new
 * element — the tooltip attaches to whatever you already have (an icon,
 * disabled button, abbreviation, existing custom component), not a
 * `Popover`-style "trigger renders itself as this element" API.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  closeDelay = 150,
  open,
  defaultOpen = false,
  onOpenChange,
  className,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const position = usePositioning(triggerRef, contentRef, { active: isOpen, placement });
  useEscapeKey(() => setIsOpen(false), isOpen);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- reading an existing ref off an arbitrary consumer-supplied element isn't expressible without `any`; cloneElement below still gets a correctly-typed element back
  const childRef = (children as any).ref as Ref<HTMLElement> | undefined;
  const childProps = children.props as Record<string, unknown>;
  const trigger = cloneElement(children, {
    ref: mergeRefs(triggerRef, childRef ?? null),
    'aria-describedby': contentId,
    onMouseEnter: (event: MouseEvent) => {
      cancelScheduledClose();
      setIsOpen(true);
      (childProps.onMouseEnter as ((e: MouseEvent) => void) | undefined)?.(event);
    },
    onMouseLeave: (event: MouseEvent) => {
      scheduleClose();
      (childProps.onMouseLeave as ((e: MouseEvent) => void) | undefined)?.(event);
    },
    onFocus: (event: FocusEvent) => {
      cancelScheduledClose();
      setIsOpen(true);
      (childProps.onFocus as ((e: FocusEvent) => void) | undefined)?.(event);
    },
    onBlur: (event: FocusEvent) => {
      scheduleClose();
      (childProps.onBlur as ((e: FocusEvent) => void) | undefined)?.(event);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cloneElement's prop-overrides overload has no slot for `ref` when `children`'s element type is unknown (its props aren't known ahead of time); the returned element is still correctly typed
  } as any);

  return (
    <>
      {trigger}
      {isOpen && (
        <Portal>
          <div
            ref={contentRef}
            id={contentId}
            role="tooltip"
            className={mergeClasses(styles.content, className)}
            style={{ position: 'absolute', left: position.x, top: position.y }}
            onMouseEnter={cancelScheduledClose}
            onMouseLeave={scheduleClose}
          >
            {content}
          </div>
        </Portal>
      )}
    </>
  );
}

Tooltip.displayName = 'Tooltip';
