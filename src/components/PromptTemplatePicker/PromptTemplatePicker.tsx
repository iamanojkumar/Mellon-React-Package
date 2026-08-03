import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Popover } from '../Popover/Popover';
import { Button } from '../Button/Button';
import { Menu, MenuItem } from '../Menu/Menu';
import { Caption } from '../Caption/Caption';
import popoverStyles from '../Popover/Popover.module.css';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './PromptTemplatePicker.module.css';

export interface PromptTemplate {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  /** The template text inserted into the composer when this template is selected. */
  content: string;
  disabled?: boolean;
}

export interface PromptTemplatePickerProps {
  templates: PromptTemplate[];
  onSelect: (template: PromptTemplate) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger button content. Defaults to `"Templates"`. */
  triggerLabel?: ReactNode;
  emptyLabel?: ReactNode;
  className?: string;
}

/**
 * A trigger button + panel of reusable prompt templates — unlike
 * `MentionPicker`/`SlashCommandPicker`, this isn't anchored to a composer's
 * caret; it's a normal standalone control (e.g. a toolbar button next to
 * the composer), so it composes `Popover` + `Menu` directly rather than
 * `useFloatingListPicker`. `Popover.Content` carries no `role` itself —
 * `Menu`'s own `role="menu"` inner element is the real landmark, the same
 * "own semantic element inside a generic overlay wrapper" shape
 * `Select`/`ContextMenu` already established. `Popover.Content` doesn't
 * manage focus on its own (by design, see its doc comment), so this wraps
 * `Menu` in its own ref'd `<div>` to focus the first item on open, the
 * same pattern `Dropdown.Menu`/`ContextMenu` use for their own panels.
 */
export function PromptTemplatePicker({
  templates,
  onSelect,
  open,
  defaultOpen = false,
  onOpenChange,
  triggerLabel = 'Templates',
  emptyLabel = 'No templates',
  className,
}: PromptTemplatePickerProps) {
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    menuWrapperRef.current
      ?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')
      ?.focus();
  }, [isOpen]);

  function handleSelect(template: PromptTemplate) {
    onSelect(template);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        ref={triggerRef}
        as={Button}
        variant="ghost"
        size="sm"
        aria-haspopup="menu"
        className={className}
      >
        {triggerLabel}
      </Popover.Trigger>
      <Popover.Content className={styles.content}>
        <div ref={menuWrapperRef}>
          {templates.length === 0 ? (
            <div className={mergeClasses(popoverStyles.content, styles.empty)}>{emptyLabel}</div>
          ) : (
            <Menu aria-label={typeof triggerLabel === 'string' ? triggerLabel : 'Prompt templates'}>
              {templates.map((template) => (
                <MenuItem
                  key={template.id}
                  disabled={template.disabled}
                  onSelect={() => handleSelect(template)}
                >
                  <span className={styles.title}>{template.title}</span>
                  {template.description && <Caption>{template.description}</Caption>}
                </MenuItem>
              ))}
            </Menu>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}

PromptTemplatePicker.displayName = 'PromptTemplatePicker';
