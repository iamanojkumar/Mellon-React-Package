import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './KeyValueList.module.css';

export interface KeyValueItem {
  label: ReactNode;
  value: ReactNode;
}

export interface KeyValueListOwnProps {
  items: KeyValueItem[];
  /**
   * Adds an AI-powered "Explain with AI" trigger next to the list —
   * explains or answers a question about the structured data. Off by
   * default, and a no-op even when `true` unless an ancestor
   * `AIProvider` is mounted — the rendered output is byte-identical to
   * today's whenever this doesn't apply. Read-only: no accept/reject,
   * since an explanation isn't something to replace the list's own data
   * with (same shape as `Alert`'s `aiExplain`).
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the list's items, serialized as "label: value" lines. Defaults to a generic explain instruction. */
  buildAIPrompt?: (items: KeyValueItem[]) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

export type KeyValueListProps = Omit<ComponentPropsWithoutRef<'dl'>, 'children'> &
  KeyValueListOwnProps;

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

function defaultBuildAIPrompt(items: KeyValueItem[]): string {
  const lines = items.map((item) => `${nodeToText(item.label)}: ${nodeToText(item.value)}`);
  return `Explain the following data:\n\n${lines.join('\n')}`;
}

/** Label/value metadata pairs — a native `<dl>` of `<dt>`/`<dd>` rows, not polymorphic (that's the correct semantic element for this data shape). */
export const KeyValueList = forwardRef<HTMLDListElement, KeyValueListProps>(function KeyValueList(
  {
    className,
    items,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    ...rest
  },
  ref,
) {
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const listElement = (
    <dl ref={ref} className={mergeClasses(styles.list, !showAI && className)} {...rest}>
      {items.map((item, index) => (
        <div className={styles.row} key={index}>
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );

  if (!showAI) return listElement;

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {listElement}
      <div className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiExplainLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(items) });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(items) })}
        />
      </div>
    </div>
  );
});

KeyValueList.displayName = 'KeyValueList';
