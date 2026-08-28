import { forwardRef, useId } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import inputStyles from '../Input/Input.module.css';
import styles from './TextArea.module.css';

export type TextAreaSize = 'sm' | 'md' | 'lg';

export interface TextAreaOwnProps {
  size?: TextAreaSize;
  invalid?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  /**
   * Adds an AI-powered rewrite affordance — a corner trigger button that
   * opens an `AISuggestionPopover` with a rewritten version of the current
   * text. Off by default, and a no-op even when `true` unless an ancestor
   * `AIProvider` is mounted (`useAI()` returns `undefined`) — the rendered
   * output is byte-identical to today's whenever this doesn't apply.
   */
  aiRewrite?: boolean;
  /** Builds the prompt sent to the AI client from the current value. Defaults to a generic rewrite instruction. */
  buildAIPrompt?: (value: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Rewrite with AI'`. */
  aiTriggerLabel?: string;
  /**
   * Fires when the AI suggestion popover opens (`true`) or closes
   * (`false`). Observation only — see `Input`'s identical prop for why an
   * accepted suggestion isn't observable through `onChange` alone.
   */
  onAIOpenChange?: (open: boolean) => void;
  /** Fires with the accepted text, immediately before it's applied to `value`. */
  onAIAccept?: (result: string) => void;
  /** Fires when a suggestion is discarded rather than accepted. */
  onAIReject?: () => void;
}

export type TextAreaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'value' | 'defaultValue' | 'onChange'
> &
  TextAreaOwnProps;

function defaultBuildAIPrompt(value: string): string {
  return `Improve the writing, fix any grammar issues, and keep the original meaning:\n\n${value}`;
}

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
    aiRewrite = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiTriggerLabel = 'Rewrite with AI',
    onAIOpenChange,
    onAIAccept,
    onAIReject,
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

  /**
   * Applies AI-accepted text through the exact same path a real keystroke
   * takes: `setValue` alone is a no-op when controlled (its `onChange`
   * config was never wired — this component's own `handleChange` is what
   * forwards to the consumer), so a controlled consumer only sees the new
   * value if `onChange` fires too. There's no real DOM event here, so a
   * minimal synthetic one carrying just `target.value` (the only field any
   * `onChange` in this codebase reads) stands in for it.
   */
  function applyAIText(text: string) {
    onAIAccept?.(text);
    setValue(text);
    onChange?.({ target: { value: text } } as ChangeEvent<HTMLTextAreaElement>);
  }

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiRewrite && !!aiClient;

  const textareaElement = (
    <textarea
      ref={ref}
      id={resolvedId}
      className={mergeClasses(
        inputStyles.input,
        styles.textarea,
        showAI && styles.hasAITrigger,
        !showAI && className,
      )}
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

  if (!showAI) return textareaElement;

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {textareaElement}
      <div className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiTriggerLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            onAIOpenChange?.(open);
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(value ?? '') });
            } else {
              aiAction.reset();
            }
          }}
          onAccept={applyAIText}
          onReject={() => {
            onAIReject?.();
            aiAction.reset();
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(value ?? '') })}
        />
      </div>
    </div>
  );
});

TextArea.displayName = 'TextArea';
