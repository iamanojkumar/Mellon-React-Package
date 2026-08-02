import { forwardRef } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';

export type NumberFieldProps = Omit<InputProps, 'type'>;

/**
 * `Input` with `type="number"` fixed — plain native number semantics
 * (`min`/`max`/`step` pass through via `...rest`), no custom
 * increment/decrement stepper UI and no locale-aware formatting, same
 * scope cut as `PhoneField` and `DatePicker`'s free-text parsing.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  function NumberField(props, ref) {
    return <Input ref={ref} {...props} type="number" />;
  },
);

NumberField.displayName = 'NumberField';
