import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Popover } from '../Popover/Popover';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AITriggerButton } from '../AITriggerButton/AITriggerButton';
import type { AIActionStatus } from '../../hooks/useAIAction';
import inputStyles from '../Input/Input.module.css';
import styles from './Combobox.module.css';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type ComboboxSize = 'sm' | 'md' | 'lg';

export interface ComboboxAISearchOptions {
  /**
   * Resolves the current input text into extra options, merged into the
   * panel below the regular filtered results under a "Suggested" heading.
   * No shared AI primitive — entirely consumer-owned, the same
   * `CommandPalette`-resolver shape `Select`'s `aiSuggest` uses. Only
   * called when the trigger is explicitly clicked, never on every
   * keystroke (unlike `CommandPalette`'s own debounced `aiSearch`).
   */
  resolve: (query: string) => Promise<ComboboxOption[]>;
  /** Accessible label for the AI trigger button. Defaults to `'Search with AI'`. */
  triggerLabel?: string;
  /** Heading shown above the AI-resolved options. Defaults to `'Suggested'`. */
  groupHeading?: ReactNode;
}

export interface ComboboxOwnProps {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: ComboboxSize;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  /** Filters `options` against the current input text. Defaults to a case-insensitive substring match on `label`. */
  filterOptions?: (options: ComboboxOption[], query: string) => ComboboxOption[];
  /**
   * When `true` (`Autocomplete`'s default), any typed text becomes the
   * value immediately — the list is suggestions, not a constraint, and
   * nothing reverts on blur/Escape. When `false` (this component's
   * default), `value` only changes when the user actually selects a
   * listed option; typing without selecting reverts the displayed text
   * back to the last committed selection on blur/Escape.
   */
  allowFreeText?: boolean;
  /** Shown in the panel when no options match the current text. Defaults to "No results". Pass `null` to render nothing. */
  noResultsLabel?: ReactNode;
  /** Adds a "Search with AI" trigger inside the open panel. Off by default. Mouse-selectable only — AI-resolved options aren't included in arrow-key roving, a deliberate scope cut (same shape as `Select`'s "no typeahead"). */
  aiSearch?: ComboboxAISearchOptions;
}

export type ComboboxProps = ComboboxOwnProps;

function defaultFilter(options: ComboboxOption[], query: string): ComboboxOption[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return options;
  return options.filter((option) => option.label.toLowerCase().includes(normalized));
}

function enabledIndices(options: ComboboxOption[]): number[] {
  return options.reduce<number[]>((acc, option, index) => {
    if (!option.disabled) acc.push(index);
    return acc;
  }, []);
}

/**
 * The ARIA APG "combobox with list autocomplete" pattern: an editable
 * `role="combobox"` text input (`aria-autocomplete="list"`, `aria-expanded`,
 * `aria-controls`, `aria-activedescendant`) filtering a `role="listbox"`/
 * `role="option"` panel as the user types — materially different from
 * `Select`'s pattern, not just a variant of it: real DOM focus must stay in
 * the text input the whole time (so typing keeps working), so the
 * "currently highlighted" option is tracked via `aria-activedescendant` +
 * an `activeIndex` state and a `data-active` attribute, not `Select`'s
 * roving-tabindex-per-option (which needs to move real focus onto each
 * option, and would kick the user out of the text field here).
 *
 * Composes `Popover` the same way `Select` does — controlled `open` state
 * (`open`/`onOpenChange` passed in), `Popover.Trigger` rendered `as="input"`
 * with `aria-haspopup` overridden to `"listbox"` (`Popover.Trigger`
 * hardcodes `"dialog"`, but `{...rest}` spreads after the hardcoded
 * defaults so this is safely overridable — see `Select.tsx`/`CLAUDE.md`).
 * `Popover.Content` itself carries no role; the real `role="listbox"`
 * element lives inside it, the same "own semantic element inside a
 * generic overlay wrapper" shape `Select`/`ContextMenu` already
 * established. Options use `onMouseDown={(e) => e.preventDefault()}` to
 * stop the input from blurring on click — the standard trick that lets a
 * click-to-select fire without racing a blur-triggered revert.
 *
 * Clicking or focusing the input (without typing) opens the panel showing
 * the *full* option list, not filtered by whatever text is currently
 * displayed (e.g. a previously-selected option's label) — filtering only
 * kicks in once the user actually types, tracked via `isFiltering`, the
 * same "don't filter until there's real intent to filter" behavior most
 * combobox implementations use. No typeahead-elsewhere scope cut needed
 * here, unlike `Select`/`Menu`/`RadioGroup` — typing *is* the whole
 * interaction model.
 */
export function Combobox({
  options,
  value: valueProp,
  defaultValue,
  onChange,
  placeholder,
  size = 'md',
  invalid,
  disabled,
  required,
  id,
  className,
  'aria-label': ariaLabel,
  filterOptions = defaultFilter,
  allowFreeText = false,
  noResultsLabel = 'No results',
  aiSearch,
}: ComboboxProps) {
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

  const selectedOption = options.find((option) => option.value === value);
  const [inputValue, setInputValue] = useState(
    selectedOption?.label ?? (allowFreeText ? (value ?? '') : ''),
  );
  const [isFiltering, setIsFiltering] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [aiOptions, setAiOptions] = useState<ComboboxOption[]>([]);
  const [aiStatus, setAiStatus] = useState<AIActionStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setAiOptions([]);
      setAiStatus('idle');
    }
  }, [isOpen]);

  // Keep displayed text in sync when `value` changes externally (controlled
  // usage) — not on every keystroke, only when the committed value itself
  // changes from outside.
  useEffect(() => {
    const label = [...options, ...aiOptions].find((option) => option.value === value)?.label;
    setInputValue(label ?? (allowFreeText ? (value ?? '') : ''));
    setIsFiltering(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const query = isFiltering ? inputValue : '';
  const filteredOptions = filterOptions(options, query);

  useEffect(() => {
    if (!isOpen || activeIndex === -1) return;
    const option = filteredOptions[activeIndex];
    if (!option) return;
    // `scrollIntoView` doesn't exist in jsdom (no layout engine) — feature-
    // detected the same way `usePointerDrag` guards `setPointerCapture`.
    listboxRef.current
      ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(option.value)}"]`)
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [isOpen, activeIndex, filteredOptions]);

  function commit(option: ComboboxOption) {
    if (option.disabled) return;
    setValue(option.value);
    setInputValue(option.label);
    setIsFiltering(false);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  async function handleAISearch() {
    if (!aiSearch) return;
    setAiStatus('loading');
    try {
      const resolved = await aiSearch.resolve(inputValue);
      setAiOptions(resolved);
      setAiStatus('idle');
    } catch {
      setAiOptions([]);
      setAiStatus('error');
    }
  }

  function revertOrClear() {
    if (allowFreeText) return;
    setInputValue(selectedOption?.label ?? '');
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setInputValue(next);
    setIsFiltering(true);
    setIsOpen(true);
    setActiveIndex(-1);
    if (allowFreeText) setValue(next);
  }

  function moveActive(direction: 1 | -1) {
    const indices = enabledIndices(filteredOptions);
    if (indices.length === 0) return;
    const currentPos = indices.indexOf(activeIndex);
    const nextPos =
      currentPos === -1
        ? direction === 1
          ? 0
          : indices.length - 1
        : (currentPos + direction + indices.length) % indices.length;
    setActiveIndex(indices[nextPos]!);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          moveActive(1);
        } else {
          moveActive(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          moveActive(-1);
        } else {
          moveActive(-1);
        }
        break;
      case 'Enter':
        if (isOpen && activeIndex !== -1) {
          event.preventDefault();
          const option = filteredOptions[activeIndex];
          if (option) commit(option);
        } else if (isOpen) {
          setIsOpen(false);
        }
        break;
      case 'Escape':
        if (isOpen) {
          event.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          revertOrClear();
        }
        break;
      default:
        break;
    }
  }

  function handleFocus() {
    setIsOpen(true);
    setIsFiltering(false);
  }

  // `Popover.Trigger`'s own click handler always toggles `open` — fine on
  // its own, but this trigger is *also* opened by focus, and a `click`
  // both focuses and clicks the input in one gesture. If focus's `setOpen
  // (true)` commits before the click event (userEvent flushes between
  // simulated events, matching real browsers), the click handler's `open`
  // read is already `true`, so its toggle flips it back to `false` right
  // after. Forcing `true` here — unconditionally, not toggling — runs
  // after that internal toggle within the same handler/batch and wins,
  // so a click always ends up open regardless of what focus already did.
  function handleClick() {
    setIsOpen(true);
    setIsFiltering(false);
  }

  function handleBlur() {
    setIsOpen(false);
    setActiveIndex(-1);
    revertOrClear();
  }

  const activeOptionId =
    activeIndex !== -1 && filteredOptions[activeIndex]
      ? `${listboxId}-option-${filteredOptions[activeIndex]!.value}`
      : undefined;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger
        ref={inputRef}
        as="input"
        id={resolvedId}
        role="combobox"
        type="text"
        autoComplete="off"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-label={ariaLabel}
        aria-invalid={resolvedInvalid || undefined}
        aria-describedby={field?.describedById}
        aria-required={resolvedRequired || undefined}
        disabled={resolvedDisabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        onBlur={handleBlur}
        className={mergeClasses(inputStyles.input, styles.trigger, className)}
        data-size={size}
        data-invalid={resolvedInvalid || undefined}
      />
      <Popover.Content className={styles.content}>
        {aiSearch && (
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- onMouseDown here only prevents the input's blur-triggered revert when clicking the AI trigger button inside, the same trick used by each option below; it's not a custom interactive control itself
          <div className={styles.aiSearchRow} onMouseDown={(event) => event.preventDefault()}>
            <AITriggerButton
              aria-label={aiSearch.triggerLabel ?? 'Search with AI'}
              status={aiStatus}
              onClick={handleAISearch}
            />
            {aiStatus === 'error' && (
              <span role="alert" className={styles.aiSearchError}>
                Couldn&apos;t get suggestions.
              </span>
            )}
          </div>
        )}
        <div ref={listboxRef} role="listbox" id={listboxId} className={styles.listbox}>
          {filteredOptions.length === 0
            ? noResultsLabel !== null && <div className={styles.noResults}>{noResultsLabel}</div>
            : filteredOptions.map((option, index) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard selection is handled by the input's own onKeyDown (Enter), not by focus/key events on this element, which never receives real DOM focus (see aria-activedescendant above)
                <div
                  key={option.value}
                  id={`${listboxId}-option-${option.value}`}
                  role="option"
                  tabIndex={-1}
                  data-value={option.value}
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  data-active={index === activeIndex || undefined}
                  className={styles.option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(option)}
                >
                  {option.label}
                </div>
              ))}
          {aiOptions.length > 0 && (
            <>
              <div className={styles.aiGroupHeading}>{aiSearch?.groupHeading ?? 'Suggested'}</div>
              {aiOptions.map((option) => (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- mouse-selectable only, see aiSearch's own doc comment on the scope cut
                <div
                  key={`ai-${option.value}`}
                  role="option"
                  tabIndex={-1}
                  data-value={option.value}
                  data-ai-suggested=""
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  className={styles.option}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(option)}
                >
                  {option.label}
                </div>
              ))}
            </>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}

Combobox.displayName = 'Combobox';
