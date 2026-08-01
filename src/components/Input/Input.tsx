import { forwardRef, useId } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputOwnProps {
  size?: InputSize;
  invalid?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export type InputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'size' | 'value' | 'defaultValue' | 'onChange'
> &
  InputOwnProps;

/**
 * Not polymorphic — a native `<input>` has no sensible `as` override.
 * Reads `FieldContext` (from an ancestor `Field`) for `id`/`invalid`/
 * `disabled`/`aria-describedby` when present, falling back to a generated
 * id and its own props for standalone usage.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    size = 'md',
    invalid,
    disabled,
    required,
    id,
    value: valueProp,
    defaultValue,
    onChange,
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

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue,
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  return (
    <input
      ref={ref}
      id={resolvedId}
      className={mergeClasses(styles.input, className)}
      data-size={size}
      data-invalid={resolvedInvalid || undefined}
      aria-invalid={resolvedInvalid || undefined}
      aria-describedby={field?.describedById}
      disabled={resolvedDisabled}
      required={resolvedRequired}
      value={value ?? ''}
      onChange={handleChange}
      {...rest}
    />
  );
});

Input.displayName = 'Input';
