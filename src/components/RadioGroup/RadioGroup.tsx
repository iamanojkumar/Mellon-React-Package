import { Children, createContext, isValidElement, useContext } from 'react';
import type { KeyboardEvent, ReactElement, ReactNode } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './RadioGroup.module.css';

export type RadioGroupOrientation = 'horizontal' | 'vertical';

interface RadioGroupContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  disabled: boolean;
  /** The first registered `Radio`'s value — the roving tab stop before anything is checked. */
  firstValue: string | undefined;
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(undefined);

function useRadioGroupContext(part: string): RadioGroupContextValue {
  const context = useContext(RadioGroupContext);
  if (!context) {
    throw new Error(`<RadioGroup.${part}> must be used within <RadioGroup>`);
  }
  return context;
}

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  orientation?: RadioGroupOrientation;
  /** `Radio` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * Custom `role="radiogroup"`/`role="radio"` widget (not native `<input
 * type="radio">`s) — deliberate, so keyboard nav goes through
 * `useRovingFocus` rather than the browser's own native same-`name`-group
 * arrow-key handling, matching this phase's "Roving-Focus Groups" grouping
 * in docs/SPEC.md. Uses "automatic activation" (arrow keys both move
 * focus *and* select, via `useRovingFocus`'s `onNavigate`) — the standard
 * WAI-ARIA APG Radio Group pattern, and the same model `Tabs.List` already
 * uses. No native-form-submission fallback (no hidden mirrored `<input>`)
 * — a real, documented gap for no-JS `<form>` submission, the same
 * trade-off already accepted for `DatePicker`.
 */
function RadioGroupRoot({
  value,
  defaultValue,
  onValueChange,
  disabled,
  orientation = 'vertical',
  children,
  className,
}: RadioGroupProps) {
  const field = useFieldContext();
  const resolvedDisabled = disabled ?? field?.disabled ?? false;

  const [currentValue, setCurrentValue] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: (next) => {
      if (next !== undefined) onValueChange?.(next);
    },
  });

  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{
    value: string;
    disabled?: boolean;
  }>[];
  const firstValue = (items.find((item) => !item.props.disabled) ?? items[0])?.props.value;

  const handleRovingKeyDown = useRovingFocus({
    itemSelector: '[role="radio"]:not([aria-disabled="true"])',
    orientation,
    onNavigate: (item) => {
      const itemValue = item.getAttribute('data-value');
      if (itemValue) setCurrentValue(itemValue);
    },
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      const target = event.target as HTMLElement;
      if (
        target.getAttribute('role') !== 'radio' ||
        target.getAttribute('aria-disabled') === 'true'
      ) {
        return;
      }
      const itemValue = target.getAttribute('data-value');
      if (itemValue) {
        event.preventDefault();
        setCurrentValue(itemValue);
      }
      return;
    }
    handleRovingKeyDown(event);
  }

  return (
    <div
      role="radiogroup"
      aria-orientation={orientation}
      aria-disabled={resolvedDisabled || undefined}
      className={mergeClasses(styles.group, className)}
      data-orientation={orientation}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      <RadioGroupContext.Provider
        value={{
          value: currentValue,
          setValue: setCurrentValue,
          disabled: resolvedDisabled,
          firstValue,
        }}
      >
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
}

export interface RadioProps {
  value: string;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

/** A single option within `RadioGroup`. Must be used inside one. */
function Radio({ value, disabled: itemDisabled = false, children, className }: RadioProps) {
  const {
    value: groupValue,
    setValue,
    disabled: groupDisabled,
    firstValue,
  } = useRadioGroupContext('Item');
  const isChecked = groupValue === value;
  const isDisabled = groupDisabled || itemDisabled;
  const isTabbable = groupValue !== undefined ? isChecked : value === firstValue;

  function handleClick() {
    if (isDisabled) return;
    setValue(value);
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter/Space are handled by RadioGroup's onKeyDown, which sees them via bubbling from whichever item holds the roving tabindex focus
    <div
      role="radio"
      aria-checked={isChecked}
      aria-disabled={isDisabled || undefined}
      tabIndex={isTabbable ? 0 : -1}
      data-value={value}
      className={mergeClasses(styles.radio, className)}
      onClick={handleClick}
    >
      <span className={styles.dot} data-checked={isChecked || undefined} aria-hidden="true" />
      {children && <span className={styles.label}>{children}</span>}
    </div>
  );
}

RadioGroupRoot.displayName = 'RadioGroup';
Radio.displayName = 'RadioGroup.Radio';

/**
 * Compound component: `<RadioGroup><RadioGroup.Radio value="a">...</RadioGroup.Radio></RadioGroup>`.
 * `Radio` is also individually named-exported — see docs/SPEC.md.
 */
export const RadioGroup = Object.assign(RadioGroupRoot, {
  Radio,
  displayName: 'RadioGroup',
});

export { Radio };
