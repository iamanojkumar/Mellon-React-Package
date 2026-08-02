import { useRef } from 'react';
import type { ChangeEvent, ClipboardEvent, KeyboardEvent } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import inputStyles from '../Input/Input.module.css';
import styles from './OTPInput.module.css';

export type OTPInputSize = 'sm' | 'md' | 'lg';
export type OTPInputCharacterType = 'numeric' | 'alphanumeric';

export interface OTPInputProps {
  /** Number of segments. Defaults to 6. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Called once, when the value becomes fully filled (all `length` segments non-empty). */
  onComplete?: (value: string) => void;
  /** Restricts each segment to digits (`'numeric'`, default) or letters+digits (`'alphanumeric'`). */
  characterType?: OTPInputCharacterType;
  /** Masks each segment's character like a password field. Defaults to `false`. */
  mask?: boolean;
  size?: OTPInputSize;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  'aria-label'?: string;
}

const NUMERIC_PATTERN = /^[0-9]$/;
const ALPHANUMERIC_PATTERN = /^[a-zA-Z0-9]$/;

function isAllowedChar(char: string, characterType: OTPInputCharacterType): boolean {
  return characterType === 'numeric' ? NUMERIC_PATTERN.test(char) : ALPHANUMERIC_PATTERN.test(char);
}

/**
 * `length` real `<input maxLength={1}>` segments sharing one controllable
 * string `value` — not `length` independent pieces of state, so a
 * consumer's `value`/`onChange` sees exactly what a native single input
 * would. The plain-string representation only works if segments are
 * always filled *contiguously from index 0* — a string can't otherwise
 * distinguish "digit '3' at position 2" from "position 1 was skipped" —
 * so focusing any segment past the first empty one snaps focus back to
 * that first empty segment instead (`handleFocus`). This still allows
 * clicking back into an *already-filled* earlier segment to correct it
 * (that's always `index <= firstEmptyIndex`), just never creates a gap
 * beyond it. Paste distributes the clipboard text across segments
 * starting at whichever one is focused — safe from the same guarantee.
 *
 * Masking (`mask`) reuses the native `type="password"` per-segment rather
 * than hand-rolling CSS dot-masking — consistent, accessible, and works
 * with password managers for free, the same reasoning `PasswordField`
 * already established for *not* reinventing native masking.
 */
export function OTPInput({
  length = 6,
  value: valueProp,
  defaultValue = '',
  onChange,
  onComplete,
  characterType = 'numeric',
  mask = false,
  size = 'md',
  disabled,
  invalid,
  className,
  'aria-label': ariaLabel,
}: OTPInputProps) {
  const field = useFieldContext();
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;

  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Mirrors `value`, but updated synchronously — `commit()`'s own `.focus()`
  // calls (auto-advance, paste) trigger `handleFocus` on the newly-focused
  // segment *before* React re-renders with the just-committed value, so
  // that handler would otherwise see the stale pre-keystroke value and
  // wrongly think the segment it's advancing *to* is still beyond the
  // first empty one, redirecting focus right back. Reading this ref
  // instead of the `value` state variable in `handleFocus` keeps the gap
  // guard consistent with what was just committed, not last render's value.
  const valueRef = useRef(value);
  valueRef.current = value;

  function charsOf(current: string): string[] {
    return Array.from({ length }, (_, i) => current[i] ?? '');
  }

  function commit(chars: string[]) {
    const next = chars.join('');
    valueRef.current = next;
    setValue(next);
    if (!chars.includes('')) onComplete?.(next);
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const char = event.target.value.slice(-1);
    if (char && !isAllowedChar(char, characterType)) return;
    const chars = charsOf(value);
    chars[index] = char;
    commit(chars);
    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      const chars = charsOf(value);
      if (chars[index] === '' && index > 0) {
        event.preventDefault();
        chars[index - 1] = '';
        commit(chars);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = Array.from(event.clipboardData.getData('text'))
      .filter((char) => isAllowedChar(char, characterType))
      .slice(0, length - index);
    if (pasted.length === 0) return;
    const chars = charsOf(value);
    pasted.forEach((char, offset) => {
      chars[index + offset] = char;
    });
    commit(chars);
    inputRefs.current[Math.min(index + pasted.length, length - 1)]?.focus();
  }

  function handleFocus(index: number, event: { target: HTMLInputElement }) {
    const chars = charsOf(valueRef.current);
    const firstEmptyIndex = chars.indexOf('');
    if (firstEmptyIndex !== -1 && index > firstEmptyIndex) {
      inputRefs.current[firstEmptyIndex]?.focus();
      return;
    }
    event.target.select();
  }

  const chars = charsOf(value);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      aria-describedby={field?.describedById}
      className={mergeClasses(styles.group, className)}
      data-disabled={resolvedDisabled || undefined}
    >
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type={mask ? 'password' : 'text'}
          inputMode={characterType === 'numeric' ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          maxLength={1}
          value={char}
          disabled={resolvedDisabled}
          aria-invalid={resolvedInvalid || undefined}
          aria-label={`Digit ${index + 1} of ${length}`}
          className={mergeClasses(inputStyles.input, styles.segment)}
          data-size={size}
          data-invalid={resolvedInvalid || undefined}
          onChange={(event) => handleChange(index, event)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => handleFocus(index, event)}
        />
      ))}
    </div>
  );
}

OTPInput.displayName = 'OTPInput';
