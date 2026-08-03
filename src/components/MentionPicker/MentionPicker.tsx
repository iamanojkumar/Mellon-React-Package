import { forwardRef, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { Caption } from '../Caption/Caption';
import popoverStyles from '../Popover/Popover.module.css';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useFloatingListPicker } from '../../hooks/useFloatingListPicker';
import type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';
import styles from './MentionPicker.module.css';

export type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';

export interface MentionOption {
  id: string;
  name: string;
  /** e.g. an `<Avatar size="xs" />`. */
  avatar?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface MentionPickerOwnProps {
  open: boolean;
  /** Viewport point to anchor the panel at — typically the host `TextArea`'s caret position after the `@`, computed by the consumer. */
  anchorPoint: { x: number; y: number };
  options: MentionOption[];
  onSelect: (option: MentionOption) => void;
  /** Called on Escape or a click outside the panel. */
  onClose: () => void;
  emptyLabel?: ReactNode;
}

export type MentionPickerProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  keyof MentionPickerOwnProps | 'children'
> &
  MentionPickerOwnProps;

/**
 * The `@mention` autocomplete popped up while typing in a composer —
 * anchored to the caret, not a trigger element, so it's built on
 * `useFloatingListPicker` rather than `Popover`/`Combobox` (see that
 * hook's own doc comment for why: real focus must stay in the host
 * `TextArea`). The consumer's own `onKeyDown` on that `TextArea` must call
 * the exposed `handleKeyDown` — this component does not listen for
 * keyboard input itself.
 */
export const MentionPicker = forwardRef<FloatingListPickerHandle, MentionPickerProps>(
  function MentionPicker(
    {
      open,
      anchorPoint,
      options,
      onSelect,
      onClose,
      emptyLabel = 'No matches',
      'aria-label': ariaLabel = 'Mentions',
      className,
      ...rest
    },
    ref,
  ) {
    const panelRef = useRef<HTMLDivElement>(null);
    const { activeIndex, position } = useFloatingListPicker({
      open,
      anchorPoint,
      items: options,
      onSelect,
      onClose,
      panelRef,
      forwardedRef: ref,
    });

    if (!open) return null;

    return (
      <Portal>
        <div
          ref={panelRef}
          role="listbox"
          aria-label={ariaLabel}
          className={mergeClasses(popoverStyles.content, styles.panel, className)}
          style={{ position: 'absolute', left: position.x, top: position.y }}
          {...rest}
        >
          {options.length === 0 ? (
            <div className={styles.empty}>{emptyLabel}</div>
          ) : (
            options.map((option, index) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard selection is routed through the host TextArea's onKeyDown -> the exposed handleKeyDown, not through focus/key events on this element, which never receives real DOM focus (see the hook's own doc comment)
              <div
                key={option.id}
                role="option"
                tabIndex={-1}
                aria-selected={index === activeIndex}
                aria-disabled={option.disabled || undefined}
                data-active={index === activeIndex || undefined}
                className={styles.option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => !option.disabled && onSelect(option)}
              >
                {option.avatar && <span className={styles.avatar}>{option.avatar}</span>}
                <span className={styles.text}>
                  <span className={styles.name}>{option.name}</span>
                  {option.description && <Caption>{option.description}</Caption>}
                </span>
              </div>
            ))
          )}
        </div>
      </Portal>
    );
  },
);

MentionPicker.displayName = 'MentionPicker';
