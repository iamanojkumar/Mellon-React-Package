import { forwardRef, useId } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import visuallyHiddenStyles from '../VisuallyHidden/VisuallyHidden.module.css';
import styles from './Switch.module.css';

export interface SwitchOwnProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  invalid?: boolean;
  /** Rendered next to the track, inside the same clickable `<label>`. Omit for a standalone switch used inside a `Field` that renders its own `Label`. */
  label?: ReactNode;
}

export type SwitchProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'checked' | 'defaultChecked' | 'onChange' | 'size'
> &
  SwitchOwnProps;

/**
 * `Checkbox`'s sibling for the on/off "toggle" shape: same real
 * `<input type="checkbox">` + `VisuallyHidden` + sibling-selector-driven
 * visual technique, with `role="switch"` added (a checkbox that visually
 * looks like a toggle should still announce as a switch to AT, since the
 * interaction and semantics — immediately taking effect, not "submit to
 * confirm" — match "switch", not "checkbox"). The track/thumb is CSS
 * only: `.thumb` slides via a `transform` keyed off the track's own
 * `[data-checked]` attribute, no JS positioning needed.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  {
    className,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    invalid,
    disabled,
    required,
    id,
    label,
    ...rest
  },
  ref,
) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const resolvedRequired = required ?? field?.required ?? false;

  const [checked, setChecked] = useControllableState<boolean>({
    value: checkedProp,
    defaultValue: defaultChecked ?? false,
    onChange: onCheckedChange,
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setChecked(event.target.checked);
  }

  return (
    <label
      className={mergeClasses(styles.wrapper, className)}
      data-disabled={resolvedDisabled || undefined}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        id={resolvedId}
        className={mergeClasses(visuallyHiddenStyles.visuallyHidden, styles.input)}
        checked={checked}
        onChange={handleChange}
        disabled={resolvedDisabled}
        required={resolvedRequired}
        aria-invalid={resolvedInvalid || undefined}
        aria-describedby={field?.describedById}
        {...rest}
      />
      <span
        className={styles.track}
        data-checked={checked || undefined}
        data-invalid={resolvedInvalid || undefined}
        aria-hidden="true"
      >
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
});

Switch.displayName = 'Switch';
