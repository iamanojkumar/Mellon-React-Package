import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { FieldContext } from '../../contexts/FieldContext';
import { HelperText } from '../HelperText/HelperText';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';
import styles from './Field.module.css';

export interface FieldOwnProps {
  label: ReactNode;
  helperText?: ReactNode;
  /** Presence implies `invalid: true` and is shown instead of helperText. */
  errorMessage?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** A single form control (e.g. `<Input />`) — reads this field's context. */
  children: ReactNode;
}

export type FieldProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & FieldOwnProps;

/**
 * Wires a label, a control, and helper/error text together via
 * `FieldContext` (not `cloneElement` — see docs/SPEC.md) so the control
 * gets the right `id`/`aria-describedby`/`aria-invalid` automatically.
 * Renders the description via the standalone `HelperText`/`ErrorMessage`
 * components rather than inlining that styling, so the same look is
 * available to custom form layouts built outside `Field`.
 * No `ref` prop: there's no single element here to forward one to — get a
 * ref on the control itself (e.g. `<Input ref={...} />`) if you need one.
 */
export function Field({
  label,
  helperText,
  errorMessage,
  required = false,
  disabled = false,
  children,
  className,
  ...rest
}: FieldProps) {
  const id = useId();
  const invalid = Boolean(errorMessage);
  const hasDescription = Boolean(errorMessage || helperText);
  const describedById = hasDescription ? `${id}-description` : undefined;

  return (
    <div
      className={mergeClasses(styles.field, className)}
      data-disabled={disabled || undefined}
      {...rest}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <FieldContext.Provider value={{ id, invalid, disabled, required, describedById }}>
        {children}
      </FieldContext.Provider>
      {hasDescription &&
        (invalid ? (
          <ErrorMessage id={describedById}>{errorMessage}</ErrorMessage>
        ) : (
          <HelperText id={describedById}>{helperText}</HelperText>
        ))}
    </div>
  );
}
