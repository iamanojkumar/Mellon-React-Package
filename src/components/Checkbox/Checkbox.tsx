import { forwardRef, useEffect, useId, useRef } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef, ReactNode } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import visuallyHiddenStyles from '../VisuallyHidden/VisuallyHidden.module.css';
import styles from './Checkbox.module.css';

export interface CheckboxOwnProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Visually a dash instead of a checkmark, and reported to AT via `aria-checked="mixed"`. Doesn't affect `checked`/`onCheckedChange` — still a plain boolean underneath, matching the native `HTMLInputElement.indeterminate` DOM property this mirrors. */
  indeterminate?: boolean;
  invalid?: boolean;
  /** Rendered next to the box, inside the same clickable `<label>`. Omit for a standalone checkbox used inside a `Field` that renders its own `Label`. */
  label?: ReactNode;
}

export type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'type' | 'checked' | 'defaultChecked' | 'onChange' | 'size'
> &
  CheckboxOwnProps;

/**
 * A real `<input type="checkbox">` (native keyboard handling, native form
 * submission — unlike `RadioGroup`'s custom `role="radio"` divs, there's no
 * roving-focus grouping concern here that would motivate reinventing it),
 * visually hidden via `VisuallyHidden`'s CSS and replaced by a sibling
 * `<span>` box driven by `:checked`/`:indeterminate`/`:focus-visible`
 * sibling selectors. `indeterminate` has no HTML attribute — only a JS
 * property — so it's applied imperatively via a ref effect, merged with
 * the forwarded ref via `mergeRefs`.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    className,
    checked: checkedProp,
    defaultChecked,
    indeterminate = false,
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

  const indeterminateRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (indeterminateRef.current) {
      indeterminateRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setChecked(event.target.checked);
  }

  return (
    <label
      className={mergeClasses(styles.wrapper, className)}
      data-disabled={resolvedDisabled || undefined}
    >
      <input
        ref={mergeRefs(ref, indeterminateRef)}
        type="checkbox"
        id={resolvedId}
        className={mergeClasses(visuallyHiddenStyles.visuallyHidden, styles.input)}
        checked={checked}
        onChange={handleChange}
        disabled={resolvedDisabled}
        required={resolvedRequired}
        aria-checked={indeterminate ? 'mixed' : undefined}
        aria-invalid={resolvedInvalid || undefined}
        aria-describedby={field?.describedById}
        {...rest}
      />
      <span
        className={styles.box}
        data-checked={checked || undefined}
        data-indeterminate={indeterminate || undefined}
        data-invalid={resolvedInvalid || undefined}
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
        <span className={styles.dash} aria-hidden="true" />
      </span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';
