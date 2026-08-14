import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { MentionPicker } from '../MentionPicker/MentionPicker';
import type { MentionOption } from '../MentionPicker/MentionPicker';
import type { FloatingListPickerHandle } from '../../hooks/useFloatingListPicker';
import type { AIActionStatus } from '../../hooks/useAIAction';
import { mergeClasses } from '../../utilities/mergeClasses';
import { canvasBlockLabel } from '../../utilities/canvasReducer';
import type { CanvasBlockData } from '../../utilities/canvasReducer';
import styles from './CanvasPromptBar.module.css';

export interface CanvasMention {
  id: string;
  label: string;
}

export interface CanvasPromptBarProps {
  /** Blocks offered for `@` reference. */
  blocks: CanvasBlockData[];
  /** Receives the prompt with any `@` references resolved to ids. */
  onSubmit: (prompt: string) => void;
  status?: AIActionStatus;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name for the input. Defaults to `'Ask or instruct the canvas'`. */
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
 * Appends the id of every block the user `@`-referenced.
 *
 * Resolving "the login note" to `block-7` in the client removes the hardest
 * thing we'd otherwise ask a model to get right, and it matters more on a
 * canvas than on a board: blocks have no column to disambiguate them, so two
 * similar labels are genuinely indistinguishable from text alone.
 */
export function buildCanvasPromptWithMentions(prompt: string, mentions: CanvasMention[]): string {
  if (mentions.length === 0) return prompt;
  const referenced = mentions.map((mention) => `"${mention.label}" = ${mention.id}`).join('; ');
  return `${prompt}\n\nReferenced blocks: ${referenced}`;
}

/**
 * The natural-language entry point to the canvas.
 *
 * Says nothing about AI availability itself — the canvas decides whether to
 * mount it, so this stays a plain input plus a caret-anchored block picker.
 */
export function CanvasPromptBar({
  blocks,
  onSubmit,
  status = 'idle',
  error,
  placeholder = 'Add, arrange, connect, or ask about blocks…',
  disabled = false,
  label = 'Ask or instruct the canvas',
  submitLabel = 'Send',
  className,
}: CanvasPromptBarProps) {
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | undefined>(undefined);
  const [mentions, setMentions] = useState<CanvasMention[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<FloatingListPickerHandle>(null);

  const busy = status === 'loading' || status === 'streaming';

  const options: MentionOption[] =
    mentionQuery === undefined
      ? []
      : blocks
          .map((block) => ({ id: block.id, name: canvasBlockLabel(block), kind: block.kind }))
          .filter((option) => option.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 8)
          .map(({ id, name, kind }) => ({ id, name, description: kind }));

  // Anchored under the input rather than at the exact caret: a single-line
  // input gives no cheap way to measure caret x, and a panel pinned to the
  // field reads the same to the user.
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
    onSubmit(buildCanvasPromptWithMentions(trimmed, surviving));
    setValue('');
    setMentions([]);
    setMentionQuery(undefined);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // The picker gets first refusal while open, so Enter picks a block rather
    // than submitting a half-typed prompt.
    if (pickerRef.current?.handleKeyDown(event)) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
    // Arrows and Delete belong to the field, not to the canvas behind it.
    event.stopPropagation();
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
        aria-label="Blocks"
      />
    </div>
  );
}

CanvasPromptBar.displayName = 'CanvasPromptBar';
