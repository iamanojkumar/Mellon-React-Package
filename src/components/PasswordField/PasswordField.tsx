import { forwardRef, useState } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './PasswordField.module.css';

export interface PasswordFieldOwnProps {
  /** Accessible labels for the show/hide toggle button. */
  showLabel?: string;
  hideLabel?: string;
}

export type PasswordFieldProps = Omit<InputProps, 'type'> & PasswordFieldOwnProps;

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 5.2C11.05 5.1 11.52 5 12 5c7 0 10.5 7 10.5 7-.6 1.15-1.6 2.7-3.1 4.1M6.6 6.6C3.8 8.4 1.5 12 1.5 12s3.5 7 10.5 7c1.5 0 2.8-.32 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * `Input` with `type="password"` plus a show/hide toggle button — the one
 * "Simple Field Control" that isn't a genuinely thin wrapper, since the
 * toggle needs its own state. Lets `Input` handle all `useFieldContext`/
 * `id`/`invalid`/`disabled` resolution itself rather than duplicating it
 * here; this component only adds the wrapper for positioning the toggle
 * and the `visible` state that flips `type` between `password`/`text`.
 * The toggle is a plain `<button>`, not `IconButton` — `IconButton` composes
 * `Button`'s CSS (padding, min sizes) which doesn't fit sitting inside an
 * input's own box the way it needs to here.
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    { className, showLabel = 'Show password', hideLabel = 'Hide password', ...rest },
    ref,
  ) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={mergeClasses(styles.wrapper, className)}>
        <Input ref={ref} {...rest} type={visible ? 'text' : 'password'} className={styles.input} />
        <button
          type="button"
          className={styles.toggle}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    );
  },
);

PasswordField.displayName = 'PasswordField';
