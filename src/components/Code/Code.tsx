import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Code.module.css';

export interface CodeOwnProps {
  /** Renders as a padded, scrollable block instead of an inline snippet. Defaults to `false`. */
  block?: boolean;
  /**
   * Adds an AI-powered "Explain with AI" trigger next to the snippet — a
   * corner button opening an `AISuggestionPopover` with an explanation of
   * what the code does. Off by default, and a no-op even when `true`
   * unless an ancestor `AIProvider` is mounted (`useAI()` returns
   * `undefined`) — the rendered output is byte-identical to today's
   * whenever this doesn't apply. Read-only: no accept/reject, since an
   * explanation isn't something to replace the snippet with (same shape
   * as `Alert`'s `aiExplain`).
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the snippet's text content. Defaults to a generic "explain this code" instruction. */
  buildAIPrompt?: (code: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt(code: string): string {
  return `Explain what this code does:\n\n${code}`;
}

export type CodeProps<C extends ElementType = 'code'> = PolymorphicComponentPropWithRef<
  C,
  CodeOwnProps
>;

type CodeComponent = <C extends ElementType = 'code'>(
  props: CodeProps<C>,
) => React.ReactElement | null;

/** Monospace code snippet, inline by default or a scrollable block via `block`. */
export const Code = forwardRef(function Code<C extends ElementType = 'code'>(
  {
    as,
    className,
    block = false,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    children,
    ...rest
  }: CodeProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'code';

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const codeElement = (
    <Component
      ref={ref}
      className={mergeClasses(styles.code, !showAI && className)}
      data-block={block || undefined}
      {...rest}
    >
      {children}
    </Component>
  );

  if (!showAI) return codeElement;

  const codeText = nodeToText(children);

  return (
    <span className={mergeClasses(styles.aiWrapper, className)} data-block={block || undefined}>
      {codeElement}
      <span className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiExplainLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(codeText) });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(codeText) })}
        />
      </span>
    </span>
  );
}) as unknown as CodeComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Code as any).displayName = 'Code';
