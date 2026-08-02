import { Children, cloneElement, isValidElement, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, FocusEvent, ReactElement, ReactNode } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ButtonGroup.module.css';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';

export interface ButtonGroupOwnProps {
  orientation?: ButtonGroupOrientation;
  /** `Button` (or `IconButton`) elements. */
  children: ReactNode;
}

export type ButtonGroupProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  ButtonGroupOwnProps;

/**
 * Visually joins a row/column of `Button`s and gives them roving-tabindex
 * keyboard navigation (`role="toolbar"`, arrow keys move focus — the
 * WAI-ARIA APG Toolbar pattern) — the first real consumer of
 * `useRovingFocus` (built in Phase 4, unused by any shipped component
 * until now).
 *
 * Each `Button` is wrapped in a plain container that clips its corners
 * (`overflow: hidden` + `border-radius` only at the group's outer edges)
 * rather than overriding `Button`'s own CSS classes — this sidesteps the
 * cross-module CSS-specificity issues `IconButton`/`FloatingActionButton`/
 * `SplitButton` all had to work around (repeating a class to outrank
 * `Button.module.css`'s equal-specificity rules), since nothing here
 * touches `Button`'s classes at all; only `tabIndex` is injected via
 * `cloneElement`.
 *
 * The roving tab stop follows whichever button last had focus by *any*
 * means (click, Tab, or arrow keys) via one container-level `onFocus`
 * handler — not just `useRovingFocus`'s `onNavigate` callback, which only
 * fires for arrow-key moves. This works because `useRovingFocus` already
 * calls the target's `.focus()` synchronously before invoking
 * `onNavigate`, so the real focus event (caught here) always precedes and
 * makes that callback redundant; omitting it keeps `activeIndex` bookkeeping
 * in one place instead of two that could disagree.
 */
export function ButtonGroup({
  orientation = 'horizontal',
  className,
  children,
  ...rest
}: ButtonGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children).filter(isValidElement);
  const [activeIndex, setActiveIndex] = useState(() => {
    const firstEnabled = items.findIndex(
      (item) => !(item.props as { disabled?: boolean }).disabled,
    );
    return firstEnabled === -1 ? 0 : firstEnabled;
  });

  const handleKeyDown = useRovingFocus({
    itemSelector: '[data-button-group-item]:not(:disabled)',
    orientation,
  });

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target;
    if (!target.hasAttribute('data-button-group-item')) return;
    const all = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[data-button-group-item]') ?? [],
    );
    const index = all.indexOf(target);
    if (index !== -1) setActiveIndex(index);
  }

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-orientation={orientation}
      className={mergeClasses(styles.group, className)}
      data-orientation={orientation}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      {...rest}
    >
      {items.map((child, index) => (
        <div className={styles.item} key={index}>
          {isValidElement(child)
            ? cloneElement(child as ReactElement<Record<string, unknown>>, {
                tabIndex: index === activeIndex ? 0 : -1,
                'data-button-group-item': '',
              })
            : child}
        </div>
      ))}
    </div>
  );
}

ButtonGroup.displayName = 'ButtonGroup';
