import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Popover } from '../Popover/Popover';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AITriggerButton } from '../AITriggerButton/AITriggerButton';
import type { AIActionStatus } from '../../hooks/useAIAction';
import inputStyles from '../Input/Input.module.css';
import selectStyles from '../Select/Select.module.css';
import type { SelectOption, SelectSize } from '../Select/Select';
import styles from './MultiSelect.module.css';

export type { SelectOption } from '../Select/Select';

export interface MultiSelectAISuggestOptions {
  /**
   * Resolves to the `value`s of the options AI recommends adding, given
   * the current option list. Resolved values that don't match an enabled
   * option are ignored; matched values are merged into whatever's already
   * selected (not a replacement) — `MultiSelect`'s whole point is
   * multiple selection.
   */
  resolve: (options: SelectOption[]) => Promise<string[]>;
  /** Accessible label for the AI trigger button. Defaults to `'Suggest with AI'`. */
  triggerLabel?: string;
}

export interface MultiSelectProps {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** Shown in the trigger when nothing is selected. Defaults to "Select…". */
  placeholder?: string;
  /** Trigger switches from joined labels to "N selected" once more than this many are picked. Defaults to 2. */
  summarizeAfter?: number;
  size?: SelectSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  /**
   * Adds a "Suggest with AI" trigger inside the open panel — same shape
   * as `Select`'s `aiSuggest` (`CommandPalette`'s resolver shape, no
   * shared `AISuggestionPopover` primitive), except `resolve` returns
   * multiple values that get merged into the existing selection rather
   * than replacing it.
   */
  aiSuggest?: MultiSelectAISuggestOptions;
}

/**
 * `Select`'s multi-value sibling — same `role="combobox"`/`role="listbox"`/
 * `role="option"` shape (see `Select.tsx` for the full ARIA/positioning
 * rationale), reusing `Select.module.css` directly for the trigger/listbox/
 * option styling rather than duplicating it (this component's own CSS
 * module only adds the selected-option checkbox visual, mirroring the
 * standalone `Checkbox` component's own box/checkmark styling). The one
 * behavioral
 * difference: selecting an option toggles it in/out of the `value` array
 * and leaves the listbox open (`aria-multiselectable="true"`) instead of
 * closing — picking several options is the point, so closing on the first
 * one would defeat it. Closes the same way `Select` does otherwise
 * (Escape, outside click).
 */
export function MultiSelect({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = 'Select…',
  summarizeAfter = 2,
  size = 'md',
  invalid,
  disabled,
  required,
  id,
  className,
  'aria-label': ariaLabel,
  aiSuggest,
}: MultiSelectProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const resolvedRequired = required ?? field?.required ?? false;
  const listboxId = `${resolvedId}-listbox`;

  const [value, setValue] = useControllableState<string[]>({
    value: valueProp,
    defaultValue: defaultValue ?? [],
    onChange,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIActionStatus>('idle');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setAiStatus('idle');
  }, [isOpen]);

  const firstEnabledIndex = options.findIndex((option) => !option.disabled);
  const [activeIndex, setActiveIndex] = useState(firstEnabledIndex);

  useEffect(() => {
    if (!isOpen) return;
    const firstSelectedIndex = options.findIndex((option) => value.includes(option.value));
    const initialIndex = firstSelectedIndex !== -1 ? firstSelectedIndex : activeIndex;
    setActiveIndex(initialIndex);
    const items = listboxRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    items?.[initialIndex]?.focus();
    // Only on open — see Select.tsx's identical effect for why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function toggleOption(option: SelectOption) {
    if (option.disabled) return;
    const next = value.includes(option.value)
      ? value.filter((v) => v !== option.value)
      : [...value, option.value];
    setValue(next);
  }

  async function handleAISuggest() {
    if (!aiSuggest) return;
    setAiStatus('loading');
    try {
      const suggested = await aiSuggest.resolve(options);
      const validValues = suggested.filter((suggestedValue) =>
        options.some((option) => option.value === suggestedValue && !option.disabled),
      );
      setAiStatus('idle');
      if (validValues.length > 0) {
        setValue(Array.from(new Set([...value, ...validValues])));
      }
    } catch {
      setAiStatus('error');
    }
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
        toggleOption(option);
      }
      return;
    }
    handleRovingKeyDown(event);
  }

  const selectedOptions = options.filter((option) => value.includes(option.value));
  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= summarizeAfter
        ? selectedOptions.map((option) => option.label).join(', ')
        : `${selectedOptions.length} selected`;

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
        className={mergeClasses(inputStyles.input, selectStyles.trigger, className)}
        data-size={size}
        data-invalid={resolvedInvalid || undefined}
      >
        <span
          className={mergeClasses(
            selectStyles.value,
            selectedOptions.length === 0 && selectStyles.placeholder,
          )}
        >
          {triggerLabel}
        </span>
        <span className={selectStyles.chevron} aria-hidden="true">
          ▾
        </span>
      </Popover.Trigger>
      <Popover.Content className={selectStyles.content}>
        {aiSuggest && (
          <div className={selectStyles.aiSuggestRow}>
            <AITriggerButton
              aria-label={aiSuggest.triggerLabel ?? 'Suggest with AI'}
              status={aiStatus}
              onClick={handleAISuggest}
            />
            {aiStatus === 'error' && (
              <span role="alert" className={selectStyles.aiSuggestError}>
                Couldn&apos;t get a suggestion.
              </span>
            )}
          </div>
        )}
        <div
          ref={listboxRef}
          role="listbox"
          id={listboxId}
          aria-multiselectable="true"
          tabIndex={-1}
          className={selectStyles.listbox}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
        >
          {options.map((option, index) => {
            const isSelected = value.includes(option.value);
            return (
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter/Space are handled by the listbox's onKeyDown, which sees them via bubbling from whichever option holds the roving tabindex focus
              <div
                key={option.value}
                role="option"
                data-value={option.value}
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                tabIndex={index === activeIndex ? 0 : -1}
                className={selectStyles.option}
                onClick={() => toggleOption(option)}
              >
                <span className={styles.row}>
                  <span
                    className={styles.checkbox}
                    data-checked={isSelected || undefined}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 16 16" width="10" height="10" className={styles.checkmark}>
                      <path
                        d="M2.5 8.5l3.2 3.2L13 4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>{option.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </Popover.Content>
    </Popover>
  );
}

MultiSelect.displayName = 'MultiSelect';
