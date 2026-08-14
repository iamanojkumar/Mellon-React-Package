import { forwardRef, useEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import type { CanvasTone } from '../../utilities/canvasReducer';
import styles from './StickyNote.module.css';

export interface StickyNoteOwnProps {
  text: string;
  /**
   * One of the five semantic roles rather than a free colour. A whiteboard
   * traditionally wants 6–8 note colours, but `variables.css` deliberately
   * defines no categorical palette — the same Foundation gap that blocks
   * multi-series charts. Tone is decoration here: the note's text carries its
   * meaning, never the hue.
   */
  tone?: CanvasTone;
  /** Swaps the text for a borderless textarea and focuses it. */
  editing?: boolean;
  onTextChange?: (text: string) => void;
  /** Called when the textarea is dismissed — blur, Escape, or Ctrl/Cmd+Enter. */
  onEditingEnd?: () => void;
  /** Accessible name when editing. Defaults to `'Note text'`. */
  editLabel?: string;
  /**
   * Adds a "Rewrite with AI" trigger in the corner, suggesting a tightened
   * version of the note's text. Off by default, and a no-op even when `true`
   * unless an ancestor `AIProvider` is mounted — the rendered output is
   * byte-identical to today's whenever this doesn't apply. Needs
   * `onTextChange` to have anything to accept into.
   */
  aiRewrite?: boolean;
  /** Builds the prompt from the note's current text. Defaults to a concision instruction. */
  buildAIPrompt?: (text: string) => string;
  /** Accessible label for the AI trigger. Defaults to `'Rewrite with AI'`. */
  aiRewriteLabel?: string;
}

function defaultBuildAIPrompt(text: string): string {
  return `Rewrite this sticky note to be clearer and more concise, keeping its meaning. Reply with the rewritten note only.\n\n${text}`;
}

export type StickyNoteProps = Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children'> &
  StickyNoteOwnProps;

/**
 * A tinted note. Presentational and self-contained — usable outside a canvas,
 * and holding no position or selection state of its own, which the canvas owns.
 */
export const StickyNote = forwardRef<HTMLDivElement, StickyNoteProps>(function StickyNote(
  {
    text,
    tone = 'neutral',
    editing = false,
    onTextChange,
    onEditingEnd,
    editLabel = 'Note text',
    aiRewrite = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiRewriteLabel = 'Rewrite with AI',
    className,
    ...rest
  },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiRewrite && !!aiClient && !!onTextChange;

  useEffect(() => {
    if (!editing) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    // Caret to the end rather than selecting everything — the common case is
    // adding to a note, not replacing it.
    textarea.setSelectionRange(text.length, text.length);
    // `text` deliberately omitted: re-running on every keystroke would fight
    // the user's caret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  return (
    <div
      ref={mergeRefs(ref, rootRef)}
      className={mergeClasses(styles.note, className)}
      data-tone={tone}
      data-editing={editing ? '' : undefined}
      {...rest}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={text}
          aria-label={editLabel}
          onChange={(event) => onTextChange?.(event.target.value)}
          onBlur={() => onEditingEnd?.()}
          onKeyDown={(event) => {
            // Escape cancels out of editing; Enter must stay available for new
            // lines, so Ctrl/Cmd+Enter is the deliberate "done" chord.
            if (
              event.key === 'Escape' ||
              (event.key === 'Enter' && (event.metaKey || event.ctrlKey))
            ) {
              event.preventDefault();
              onEditingEnd?.();
            }
            // Everything else stays inside the textarea rather than reaching the
            // canvas, where arrows would move the note instead of the caret.
            event.stopPropagation();
          }}
        />
      ) : (
        <p className={styles.text}>{text}</p>
      )}

      {showAI && (
        <span
          className={styles.aiTrigger}
          // Marked and stopped so a press on the trigger opens the popover
          // instead of dragging the note out from under it — the same guard
          // `KanbanCard` uses for its menu.
          data-canvas-block-actions=""
          onPointerDown={(event) => event.stopPropagation()}
        >
          <AISuggestionPopover
            triggerLabel={aiRewriteLabel}
            status={aiAction.status}
            result={aiAction.result}
            {...(aiAction.error ? { error: aiAction.error } : {})}
            onOpenChange={(open) => {
              if (open) aiAction.trigger({ prompt: buildAIPrompt(text) });
              else aiAction.reset();
            }}
            onAccept={(result) => {
              onTextChange?.(result);
              aiAction.reset();
            }}
            onReject={() => aiAction.reset()}
            onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(text) })}
          />
        </span>
      )}
    </div>
  );
});

StickyNote.displayName = 'StickyNote';
