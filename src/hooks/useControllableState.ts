import { useCallback, useState } from 'react';

export interface UseControllableStateProps<T> {
  /** Controlled value. When provided, this hook defers entirely to it. */
  value?: T;
  /** Initial value for uncontrolled usage (ignored once `value` is provided). */
  defaultValue?: T;
  onChange?: (value: T) => void;
}

/**
 * Standard controlled/uncontrolled value pattern: pass `value` +
 * `onChange` for a controlled component, or `defaultValue` (or nothing)
 * for an uncontrolled one that manages its own state.
 */
export function useControllableState<T>({
  value: controlledValue,
  defaultValue,
  onChange,
}: UseControllableStateProps<T>): [T, (next: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue as T);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? (controlledValue as T) : uncontrolledValue;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  return [value, setValue];
}
