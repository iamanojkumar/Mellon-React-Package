import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { MentionPicker } from '../MentionPicker/MentionPicker';
import type { MentionOption } from '../MentionPicker/MentionPicker';
import type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';
import type { AIActionStatus } from '../../hooks/useAIAction';
import { mergeClasses } from '../../utilities/mergeClasses';
import type { KanbanCard } from '../../utilities/kanbanReducer';
import styles from './KanbanPromptBar.module.css';

export interface KanbanMention {
  id: string;
  label: string;
}

export interface KanbanPromptBarProps {
  /** Cards offered for `@` reference. */
  cards: KanbanCard[];
  /** Receives the prompt with any `@` references resolved to ids. */
  onSubmit: (prompt: string) => void;
  status?: AIActionStatus;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name for the input. Defaults to `'Ask or instruct the board'`. */
  label?: string;
  submitLabel?: ReactNode;
  className?: string;
}

/** The `@token` immediately before the caret, if the user is mid-mention. */
function activeMentionQuery(value: string, caret: number): string | undefined {
  const before = value.slice(0, caret);
  const match = before.match(/@([\w-]*)$/);
  return match?.[1];
}

/**
 * Appends the id of every card the user `@`-referenced.
 *
 * This is the point of the mention picker: resolving "the login bug" to
 * `card-7` in the client removes the single hardest thing we'd otherwise be
 * asking a model to get right, and it's the failure that corrupts boards —
 * two cards with similar titles and a confident guess between them.
 */
export function buildPromptWithMentions(prompt: string, mentions: KanbanMention[]): string {
  if (mentions.length === 0) return prompt;
  const referenced = mentions.map((mention) => `"${mention.label}" = ${mention.id}`).join('; ');
  return `${prompt}\n\nReferenced cards: ${referenced}`;
}

/**
 * The natural-language entry point to the board.
 *
 * Renders nothing on its own about AI availability — the board decides
 * whether to mount it at all, so this component stays a plain input plus a
 * caret-anchored card picker.
 */
export function KanbanPromptBar({
  cards,
  onSubmit,
  status = 'idle',
  error,
  placeholder = 'Move, add, or ask about cards…',
  disabled = false,
  label = 'Ask or instruct the board',
  submitLabel = 'Send',
  className,
}: KanbanPromptBarProps) {
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | undefined>(undefined);
  const [mentions, setMentions] = useState<KanbanMention[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<FloatingListPickerHandle>(null);

  const busy = status === 'loading' || status === 'streaming';

  const options: MentionOption[] =
    mentionQuery === undefined
      ? []
      : cards
          .filter((card) => card.title.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 8)
          .map((card) => ({ id: card.id, name: card.title }));

  // The picker anchors under the input rather than at the exact caret: a
  // single-line input gives no cheap way to measure caret x, and a panel
  // pinned to the field reads the same to the user.
  const anchorPoint = (() => {
    const rect = inputRef.current?.getBoundingClientRect();
    return rect ? { x: rect.left, y: rect.bottom } : { x: 0, y: 0 };
  })();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setValue(next);
    setMentionQuery(activeMentionQuery(next, event.target.selectionStart ?? next.length));
  }

  function selectMention(option: MentionOption) {
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@([\w-]*)$/, `@${option.name} `);
    setValue(before + value.slice(caret));
    setMentions((previous) =>
      previous.some((mention) => mention.id === option.id)
        ? previous
        : [...previous, { id: option.id, label: option.name }],
    );
    setMentionQuery(undefined);
    input?.focus();
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || busy || disabled) return;
    // Only mentions still present in the text count — deleting an @reference
    // shouldn't leave its id riding along invisibly.
    const surviving = mentions.filter((mention) => value.includes(mention.label));
    onSubmit(buildPromptWithMentions(trimmed, surviving));
    setValue('');
    setMentions([]);
    setMentionQuery(undefined);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // The picker gets first refusal on every key while it's open, so Enter
    // picks a card instead of submitting a half-typed prompt.
    if (pickerRef.current?.handleKeyDown(event)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className={mergeClasses(styles.bar, className)}>
      <div className={styles.row}>
        <Input
          ref={inputRef}
          className={styles.input}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          disabled={disabled}
          invalid={Boolean(error)}
        />
        <Button size="sm" onClick={submit} loading={busy} disabled={disabled || !value.trim()}>
          {submitLabel}
        </Button>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <MentionPicker
        ref={pickerRef}
        open={mentionQuery !== undefined && options.length > 0}
        anchorPoint={anchorPoint}
        options={options}
        onSelect={selectMention}
        onClose={() => setMentionQuery(undefined)}
        aria-label="Cards"
      />
    </div>
  );
}

KanbanPromptBar.displayName = 'KanbanPromptBar';
