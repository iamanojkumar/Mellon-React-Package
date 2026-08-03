import { forwardRef, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, FocusEvent, ReactNode } from 'react';
import { mergeRefs } from '../../utilities/mergeRefs';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { Button } from '../Button/Button';
import { ToggleButton } from '../ToggleButton/ToggleButton';
import styles from './CodeBlockToolbar.module.css';

export interface CodeBlockToolbarOwnProps {
  /** Shown at the start of the bar, e.g. a language name or filename. */
  label?: ReactNode;
  onCopy?: () => void;
  onDownload?: () => void;
  onRun?: () => void;
  /** Controls the expand/collapse toggle's pressed state and label. Omit both this and `onExpandedChange` to not show the toggle at all. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export type CodeBlockToolbarProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  CodeBlockToolbarOwnProps;

/**
 * A header bar for a `Code` block (copy/download/run + an expand/collapse
 * toggle) — a sibling the consumer places above/around `Code`, not a prop
 * on `Code` itself, since `Code` also covers the plain inline-snippet case
 * that has no toolbar. Same roving-focus toolbar shape as
 * `MessageActionBar` (see that component's own reasoning for rolling a
 * custom toolbar instead of reusing `ButtonGroup`'s visually-joined CSS).
 * The expand/collapse action reuses `ToggleButton` directly — unlike
 * `FeedbackControl`'s up/down pair, there's no second button it needs to
 * stay mutually exclusive with, so `ToggleButton`'s own internal state
 * management fits without a workaround.
 */
export const CodeBlockToolbar = forwardRef<HTMLDivElement, CodeBlockToolbarProps>(
  function CodeBlockToolbar(
    {
      className,
      label,
      onCopy,
      onDownload,
      onRun,
      expanded,
      defaultExpanded = false,
      onExpandedChange,
      ...rest
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const showExpandToggle = expanded !== undefined || onExpandedChange !== undefined;
    const [isExpanded, setIsExpanded] = useControllableState<boolean>({
      value: expanded,
      defaultValue: defaultExpanded,
      onChange: onExpandedChange,
    });

    const handleKeyDown = useRovingFocus({
      itemSelector: '[data-code-toolbar-action]',
      orientation: 'horizontal',
    });

    function handleFocus(event: FocusEvent<HTMLDivElement>) {
      const all = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>('[data-code-toolbar-action]') ?? [],
      );
      const index = all.indexOf(event.target);
      if (index !== -1) setActiveIndex(index);
    }

    let index = -1;
    function nextTabIndex() {
      index += 1;
      return index === activeIndex ? 0 : -1;
    }

    if (!label && !onCopy && !onDownload && !onRun && !showExpandToggle) return null;

    return (
      <div
        ref={mergeRefs(containerRef, ref)}
        role="toolbar"
        aria-label="Code block actions"
        className={mergeClasses(styles.bar, className)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        {...rest}
      >
        {label && <span className={styles.label}>{label}</span>}
        <span className={styles.actions}>
          {onCopy && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-code-toolbar-action=""
              tabIndex={nextTabIndex()}
              onClick={onCopy}
            >
              Copy
            </Button>
          )}
          {onDownload && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-code-toolbar-action=""
              tabIndex={nextTabIndex()}
              onClick={onDownload}
            >
              Download
            </Button>
          )}
          {onRun && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-code-toolbar-action=""
              tabIndex={nextTabIndex()}
              onClick={onRun}
            >
              Run
            </Button>
          )}
          {showExpandToggle && (
            <ToggleButton
              variant="ghost"
              size="sm"
              data-code-toolbar-action=""
              tabIndex={nextTabIndex()}
              pressed={isExpanded}
              onPressedChange={setIsExpanded}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </ToggleButton>
          )}
        </span>
      </div>
    );
  },
);

CodeBlockToolbar.displayName = 'CodeBlockToolbar';
