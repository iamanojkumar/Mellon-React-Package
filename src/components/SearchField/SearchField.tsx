import { forwardRef } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './SearchField.module.css';

export interface SearchFieldOwnProps {
  /** Accessible label for the clear button. Defaults to "Clear search". */
  clearLabel?: string;
  /**
   * Adds an AI-powered semantic search affordance next to the clear button
   * — a trigger opening an `AISuggestionPopover` with an AI-refined query.
   * Off by default, and a no-op even when `true` unless an ancestor
   * `AIProvider` is mounted. Only shown once there's a query to search on,
   * the same visibility rule the clear button already follows.
   */
  aiSearch?: boolean;
  /** Builds the prompt sent to the AI client from the current query. Defaults to a generic semantic-search instruction. */
  buildAIPrompt?: (query: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Search with AI'`. */
  aiTriggerLabel?: string;
}

export type SearchFieldProps = Omit<InputProps, 'type'> & SearchFieldOwnProps;

function defaultBuildAIPrompt(query: string): string {
  return `Suggest a better, more precise search query with the same intent as:\n\n${query}`;
}

/**
 * `Input` with `type="search"` plus a clear button, shown once there's a
 * value. Unlike `EmailField`/`PhoneField`/`NumberField` (pure passthrough),
 * this one needs to know the current value to decide whether to render the
 * clear button and to reset it on click — so it owns `useControllableState`
 * itself and always renders `Input` in controlled mode (passing a defined
 * `value`/`onChange` down), the same shape `Input.stories.tsx`'s
 * `Controlled` story already demonstrates. The browser's own native
 * `type="search"` clear affordance (`::-webkit-search-cancel-button`) is
 * suppressed via CSS so it doesn't visually double up with this one.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    className,
    clearLabel = 'Clear search',
    value: valueProp,
    defaultValue,
    onChange,
    aiSearch = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiTriggerLabel = 'Search with AI',
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue,
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  function handleClear() {
    applySearchText('');
  }

  /**
   * Applies AI-accepted text through the exact same path a real keystroke
   * takes: `setValue` alone is a no-op when controlled (its `onChange`
   * config was never wired — this component's own `handleChange` is what
   * forwards to the consumer), so a controlled consumer only sees the new
   * value if `onChange` fires too. There's no real DOM event for a
   * programmatic change, so a minimal synthetic one carrying just
   * `target.value` stands in for it.
   */
  function applySearchText(text: string) {
    setValue(text);
    onChange?.({ target: { value: text } } as ChangeEvent<HTMLInputElement>);
  }

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiSearch && !!aiClient && !!value;

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <Input
        ref={ref}
        {...rest}
        type="search"
        value={value ?? ''}
        onChange={handleChange}
        className={mergeClasses(styles.input, value && styles.hasClear, showAI && styles.hasAI)}
      />
      {showAI && (
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
            onAccept={applySearchText}
            onReject={() => aiAction.reset()}
            onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(value ?? '') })}
          />
        </div>
      )}
      {!!value && (
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
});

SearchField.displayName = 'SearchField';
