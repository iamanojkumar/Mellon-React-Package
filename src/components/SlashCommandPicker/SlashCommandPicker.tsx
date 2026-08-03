import { forwardRef, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { Caption } from '../Caption/Caption';
import popoverStyles from '../Popover/Popover.module.css';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useFloatingListPicker } from '../../hooks/useFloatingListPicker';
import type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';
import styles from './SlashCommandPicker.module.css';

export type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';

export interface SlashCommand {
  id: string;
  label: string;
  description?: ReactNode;
  /** A small leading glyph, e.g. an inline SVG — this project has no icon library, see `AlertVariantIcon`. */
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SlashCommandPickerOwnProps {
  open: boolean;
  /** Viewport point to anchor the panel at — typically the host `TextArea`'s caret position after the `/`, computed by the consumer. */
  anchorPoint: { x: number; y: number };
  commands: SlashCommand[];
  onSelect: (command: SlashCommand) => void;
  /** Called on Escape or a click outside the panel. */
  onClose: () => void;
  emptyLabel?: ReactNode;
}

export type SlashCommandPickerProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  keyof SlashCommandPickerOwnProps | 'children'
> &
  SlashCommandPickerOwnProps;

/**
 * The `/command` autocomplete popped up while typing in a composer — same
 * shape as `MentionPicker` (both anchor to the host `TextArea`'s caret and
 * delegate keyboard handling via `useFloatingListPicker`'s exposed
 * `handleKeyDown` rather than owning real focus), kept as its own
 * component rather than merged with `MentionPicker` since the two have
 * different data models (a person to @-mention vs. an executable
 * command) — the same "share the mechanics, not the component" choice
 * `Alert`/`Banner` made for their own shared variant language.
 */
export const SlashCommandPicker = forwardRef<FloatingListPickerHandle, SlashCommandPickerProps>(
  function SlashCommandPicker(
    {
      open,
      anchorPoint,
      commands,
      onSelect,
      onClose,
      emptyLabel = 'No matching commands',
      'aria-label': ariaLabel = 'Commands',
      className,
      ...rest
    },
    ref,
  ) {
    const panelRef = useRef<HTMLDivElement>(null);
    const { activeIndex, position } = useFloatingListPicker({
      open,
      anchorPoint,
      items: commands,
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
          {commands.length === 0 ? (
            <div className={styles.empty}>{emptyLabel}</div>
          ) : (
            commands.map((command, index) => (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard selection is routed through the host TextArea's onKeyDown -> the exposed handleKeyDown, not through focus/key events on this element, which never receives real DOM focus (see useFloatingListPicker's own doc comment)
              <div
                key={command.id}
                role="option"
                tabIndex={-1}
                aria-selected={index === activeIndex}
                aria-disabled={command.disabled || undefined}
                data-active={index === activeIndex || undefined}
                className={styles.option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => !command.disabled && onSelect(command)}
              >
                {command.icon && <span className={styles.icon}>{command.icon}</span>}
                <span className={styles.text}>
                  <span className={styles.label}>{command.label}</span>
                  {command.description && <Caption>{command.description}</Caption>}
                </span>
              </div>
            ))
          )}
        </div>
      </Portal>
    );
  },
);

SlashCommandPicker.displayName = 'SlashCommandPicker';
