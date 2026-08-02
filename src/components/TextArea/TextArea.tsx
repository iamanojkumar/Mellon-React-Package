import { forwardRef, useId } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import inputStyles from '../Input/Input.module.css';
import styles from './TextArea.module.css';

export type TextAreaSize = 'sm' | 'md' | 'lg';

export interface TextAreaOwnProps {
  size?: TextAreaSize;
  invalid?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

export type TextAreaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'defaultValue' | 'onChange'
> &
  TextAreaOwnProps;

/**
 * Multi-line sibling of `Input` — same `useFieldContext`/
 * `useControllableState` wiring, and reuses `Input.module.css`'s `.input`
 * box styling directly (border/focus-ring/disabled/size scale are
 * identical) rather than duplicating it, the same cross-component CSS
 * pattern `Display`/`IconButton`/etc. already established. `TextArea.
 * module.css` only adds the `resize`/`min-height` rules that are specific
 * to a `<textarea>`.
 */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
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

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  return (
    <textarea
      ref={ref}
      id={resolvedId}
      className={mergeClasses(inputStyles.input, styles.textarea, className)}
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

TextArea.displayName = 'TextArea';
