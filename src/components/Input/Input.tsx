import { forwardRef, useId } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputOwnProps {
  size?: InputSize;
  invalid?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /**
   * Adds an AI-powered autocomplete affordance — a corner trigger button
   * that opens an `AISuggestionPopover` with a suggested completion/
   * rewrite of the current text. Off by default, and a no-op even when
   * `true` unless an ancestor `AIProvider` is mounted — the rendered
   * output is byte-identical to today's whenever this doesn't apply.
   * Same shape as `TextArea`'s `aiRewrite`.
   */
  aiAutocomplete?: boolean;
  /** Builds the prompt sent to the AI client from the current value. Defaults to a generic completion instruction. */
  buildAIPrompt?: (value: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Autocomplete with AI'`. */
  aiTriggerLabel?: string;
}

function defaultBuildAIPrompt(value: string): string {
  return `Suggest a completion or improvement for this text:\n\n${value}`;
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
    aiAutocomplete = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiTriggerLabel = 'Autocomplete with AI',
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

  /**
   * Applies AI-accepted text through the exact same path a real keystroke
   * takes — see `TextArea`'s identical helper for why `setValue` alone
   * isn't enough when controlled.
   */
  function applyAIText(text: string) {
    setValue(text);
    onChange?.({ target: { value: text } } as ChangeEvent<HTMLInputElement>);
  }

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiAutocomplete && !!aiClient;

  const inputElement = (
    <input
      ref={ref}
      id={resolvedId}
      className={mergeClasses(styles.input, showAI && styles.hasAITrigger, !showAI && className)}
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

  if (!showAI) return inputElement;

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {inputElement}
      <div className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiTriggerLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(value ?? '') });
            } else {
              aiAction.reset();
            }
          }}
          onAccept={applyAIText}
          onReject={() => aiAction.reset()}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(value ?? '') })}
        />
      </div>
    </div>
  );
});

Input.displayName = 'Input';
