import { forwardRef } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';

export type EmailFieldProps = Omit<InputProps, 'type'>;

/**
 * `Input` with `type="email"` fixed — genuinely thin, no validation or
 * formatting beyond what the browser's own `type="email"` gives for free
 * (basic shape checking via `:invalid`, the right virtual keyboard on
 * mobile). Composes `Input` directly (not just its CSS) since there's
 * nothing else to add.
 */
export const EmailField = forwardRef<HTMLInputElement, EmailFieldProps>(
  function EmailField(props, ref) {
    return <Input ref={ref} {...props} type="email" />;
  },
);

EmailField.displayName = 'EmailField';
