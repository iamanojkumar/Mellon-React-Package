import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Popover } from '../Popover/Popover';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import inputStyles from '../Input/Input.module.css';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Shown in the trigger when nothing is selected. Defaults to "Select…". */
  placeholder?: string;
  size?: SelectSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * The ARIA APG "select-only combobox" pattern: a `role="combobox"` trigger
 * (`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`) opening a
 * `role="listbox"`/`role="option"` panel — not `Dropdown.Menu`'s
 * `role="menu"`, which is the wrong pattern for a form control (see
 * docs/SPEC.md's Phase 9 notes). Composes `Popover` for positioning/
 * dismissal but owns `open` state itself (`open`/`onOpenChange` passed in
 * as controlled props) rather than relying on `Popover`'s own internal
 * state, since selecting an option needs to close the panel from *inside*
 * `Select`'s own option-click handler — outside `Popover.Trigger`/
 * `Popover.Content`'s reach. `Popover.Content` itself carries no role
 * (it's just the positioned/portaled wrapper); the actual `role="listbox"`
 * element with the roving-tabindex keydown handler is nested inside it —
 * the same "own semantic element inside a generic overlay wrapper"
 * shape `ContextMenu` uses for `Menu` inside its own portal.
 *
 * The trigger reuses `Input.module.css`'s `.input` box styling directly on
 * a `<button>` (not a native `<select>`) — same cross-component CSS reuse
 * pattern as `TextArea`. `activeIndex` + a container `onFocus` handler is
 * the same roving-tabindex template `Menu`/`ButtonGroup` already
 * established. No typeahead (jump-to-option-by-typing-a-letter) — a
 * deliberate scope cut, the same kind already accepted for `DatePicker`'s
 * free-text parsing.
 */
export function Select({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = 'Select…',
  size = 'md',
  invalid,
  disabled,
  required,
  id,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const resolvedRequired = required ?? field?.required ?? false;
  const listboxId = `${resolvedId}-listbox`;

  const [value, setValue] = useControllableState<string | undefined>({
    value: valueProp,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onChange?.(next);
    },
  });

  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (selectedIndex !== -1) return selectedIndex;
    return options.findIndex((option) => !option.disabled);
  });

  useEffect(() => {
    if (!isOpen) return;
    const initialIndex = selectedIndex !== -1 ? selectedIndex : activeIndex;
    setActiveIndex(initialIndex);
    const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    items?.[initialIndex]?.focus();
    // Only on open — not a dependency on selectedIndex/activeIndex, which
    // would refocus on every selection change while already open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function selectOption(option: SelectOption) {
    if (option.disabled) return;
    setValue(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  const handleRovingKeyDown = useRovingFocus({
    itemSelector: '[role="option"]:not([aria-disabled="true"])',
    orientation: 'vertical',
  });

  function handleFocus(event: { target: HTMLElement }) {
    if (!event.target.hasAttribute('data-value')) return;
    const all = Array.from(
      listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [],
    );
    const index = all.indexOf(event.target);
    if (index !== -1) setActiveIndex(index);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target as HTMLElement;
      if (
        target.getAttribute('role') !== 'option' ||
        target.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }
      const optValue = target.getAttribute('data-value');
      const option = options.find((o) => o.value === optValue);
      if (option) {
        event.preventDefault();
        selectOption(option);
      }
      return;
    }
    handleRovingKeyDown(event);
  }

  const selectedOption = selectedIndex !== -1 ? options[selectedIndex] : undefined;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        ref={triggerRef}
        id={resolvedId}
        role="combobox"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-invalid={resolvedInvalid || undefined}
        aria-describedby={field?.describedById}
        aria-required={resolvedRequired || undefined}
        disabled={resolvedDisabled}
        className={mergeClasses(inputStyles.input, styles.trigger, className)}
        data-size={size}
        data-invalid={resolvedInvalid || undefined}
      >
        <span className={mergeClasses(styles.value, !selectedOption && styles.placeholder)}>
          {selectedOption?.label ?? placeholder}
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </Popover.Trigger>
      <Popover.Content className={styles.content}>
        <div
          ref={listboxRef}
          role="listbox"
          id={listboxId}
          tabIndex={-1}
          className={styles.listbox}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        >
          {options.map((option, index) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter/Space are handled by the listbox's onKeyDown, which sees them via bubbling from whichever option holds the roving tabindex focus
            <div
              key={option.value}
              role="option"
              data-value={option.value}
              aria-selected={option.value === value}
              aria-disabled={option.disabled || undefined}
              tabIndex={index === activeIndex ? 0 : -1}
              className={styles.option}
              onClick={() => selectOption(option)}
            >
              {option.label}
            </div>
          ))}
        </div>
      </Popover.Content>
    </Popover>
  );
}

Select.displayName = 'Select';
