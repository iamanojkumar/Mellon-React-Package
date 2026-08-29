import { useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { Input } from '../Input/Input';
import type { InputSize } from '../Input/Input';
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

/**
 * A thing the host app can be `@`-mentioned about that isn't a canvas block —
 * a page, a document, a record, whatever the app's own unit of work is.
 */
export interface CanvasReference {
  id: string;
  name: string;
  /** Shown beside the name in the picker, the way a block's `kind` is. */
  description?: string;
}

/** Heading `references` are listed under in the submitted prompt when the host doesn't name one. */
export const DEFAULT_REFERENCE_LABEL = 'References';

export interface CanvasPromptBarProps {
  /** Blocks offered for `@` reference. */
  blocks: CanvasBlockData[];
  /**
   * Host-owned things offered for `@` reference alongside `blocks` — a page,
   * a document, a record. They appear in the same picker but are listed under
   * their own heading in the submitted prompt (`referenceLabel`), never as
   * `Referenced blocks:`.
   *
   * That separation is the whole point: a model told a block with some id
   * exists on the canvas will aim commands at it, and every one of those is
   * then rejected by `applyCanvasCommands` for naming an id no block has.
   *
   * Ids are matched against `blocks` by value, so a reference sharing an id
   * with a real block is reported as that block. Keep the two namespaces
   * distinct — which they naturally are when references are the host's own
   * entities.
   */
  references?: CanvasReference[];
  /** Heading `references` are listed under in the prompt. Defaults to `'References'`; pass e.g. `'Referenced pages'` to name them in the app's own terms. */
  referenceLabel?: string;
  /** Receives the prompt with any `@` references resolved to ids. */
  onSubmit: (prompt: string) => void;
  status?: AIActionStatus;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Accessible name for the input. Defaults to `'Ask or instruct the canvas'`. */
  label?: string;
  submitLabel?: ReactNode;
  /**
   * Field size, forwarded to `Input`. Defaults to `'md'`.
   *
   * Meaningful under `variant="minimal"` too: that variant drops only the
   * horizontal padding, so a chat composer can stand taller than a toolbar
   * input instead of collapsing to a single line of text.
   */
  size?: InputSize;
  className?: string;
  /**
   * `'minimal'` drops the input's border/background and hides the Send
   * button — Enter still submits. For a chrome-light host like
   * `CanvasChatPanel` rather than a toolbar row. Defaults to `'default'`,
   * which renders byte-identical to before this prop existed.
   */
  variant?: 'default' | 'minimal';
}

/** The `@token` immediately before the caret, if the user is mid-mention. */
function activeMentionQuery(value: string, caret: number): string | undefined {
  const before = value.slice(0, caret);
  const match = before.match(/@([\w-]*)$/);
  return match?.[1];
}

function mentionList(mentions: CanvasMention[]): string {
  return mentions.map((mention) => `"${mention.label}" = ${mention.id}`).join('; ');
}

/**
 * Appends the id of everything the user `@`-referenced.
 *
 * Resolving "the login note" to `block-7` in the client removes the hardest
 * thing we'd otherwise ask a model to get right, and it matters more on a
 * canvas than on a board: blocks have no column to disambiguate them, so two
 * similar labels are genuinely indistinguishable from text alone.
 *
 * Blocks and host-supplied `references` go out under separate headings, and
 * that is load-bearing rather than cosmetic — anything listed as a block is
 * something the model will aim `move`/`update`/`delete` commands at, and
 * every such command naming a non-block id comes straight back as a
 * rejection. `references` is the third and fourth arguments rather than a
 * changed signature so existing two-argument calls emit byte-identical text.
 */
export function buildCanvasPromptWithMentions(
  prompt: string,
  mentions: CanvasMention[],
  references: CanvasMention[] = [],
  referenceLabel: string = DEFAULT_REFERENCE_LABEL,
): string {
  const lines: string[] = [];
  if (mentions.length > 0) lines.push(`Referenced blocks: ${mentionList(mentions)}`);
  if (references.length > 0) lines.push(`${referenceLabel}: ${mentionList(references)}`);
  return lines.length === 0 ? prompt : `${prompt}\n\n${lines.join('\n')}`;
}

/**
 * The natural-language entry point to the canvas.
 *
 * Says nothing about AI availability itself — the canvas decides whether to
 * mount it, so this stays a plain input plus a caret-anchored block picker.
 */
export function CanvasPromptBar({
  blocks,
  references = [],
  referenceLabel = DEFAULT_REFERENCE_LABEL,
  onSubmit,
  status = 'idle',
  error,
  placeholder = 'Add, arrange, connect, or ask about blocks…',
  disabled = false,
  label = 'Ask or instruct the canvas',
  submitLabel = 'Send',
  size = 'md',
  className,
  variant = 'default',
}: CanvasPromptBarProps) {
  const minimal = variant === 'minimal';
  const [value, setValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | undefined>(undefined);
  const [mentions, setMentions] = useState<CanvasMention[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<FloatingListPickerHandle>(null);

  const busy = status === 'loading' || status === 'streaming';

  // Which side of the prompt an option ends up on. A `Set` rather than a flag
  // smuggled onto `MentionOption`: the picker's option type is shared with
  // every other mention surface and has no business growing a canvas-only
  // field.
  const referenceIds = new Set(references.map((reference) => reference.id));

  const options: MentionOption[] =
    mentionQuery === undefined
      ? []
      : [
          ...blocks.map((block) => ({
            id: block.id,
            name: canvasBlockLabel(block),
            description: block.kind,
          })),
          ...references.map((reference) => ({
            id: reference.id,
            name: reference.name,
            ...(reference.description ? { description: reference.description } : {}),
          })),
        ]
          .filter((option) => option.name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 8);

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
    onSubmit(
      buildCanvasPromptWithMentions(
        trimmed,
        surviving.filter((mention) => !referenceIds.has(mention.id)),
        surviving.filter((mention) => referenceIds.has(mention.id)),
        referenceLabel,
      ),
    );
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
          size={size}
          className={mergeClasses(styles.input, minimal && styles.inputMinimal)}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          aria-busy={busy || undefined}
          disabled={disabled}
          invalid={Boolean(error)}
        />
        {!minimal && (
          <Button size="sm" onClick={submit} loading={busy} disabled={disabled || !value.trim()}>
            {submitLabel}
          </Button>
        )}
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
        aria-label={references.length > 0 ? 'Blocks and references' : 'Blocks'}
      />
    </div>
  );
}

CanvasPromptBar.displayName = 'CanvasPromptBar';
