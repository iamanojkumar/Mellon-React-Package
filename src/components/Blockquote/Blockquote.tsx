import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import textStyles from '../Text/Text.module.css';
import type { TextColor, TextSize } from '../Text/Text';
import styles from './Blockquote.module.css';

export interface BlockquoteOwnProps {
  size?: TextSize;
  color?: TextColor;
  /**
   * Adds an AI-powered "Explain with AI" trigger next to the quote. Off by
   * default, and a no-op even when `true` unless an ancestor `AIProvider`
   * is mounted — the rendered output is byte-identical to today's whenever
   * this doesn't apply. Read-only: no accept/reject, since an explanation
   * isn't something to replace the quote with (same shape as `Alert`'s
   * `aiExplain`).
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the quote's text content. Defaults to a generic "explain this quote" instruction. */
  buildAIPrompt?: (text: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt(text: string): string {
  return `Explain the meaning and context of this quote:\n\n${text}`;
}

export type BlockquoteProps<C extends ElementType = 'blockquote'> = PolymorphicComponentPropWithRef<
  C,
  BlockquoteOwnProps
>;

type BlockquoteComponent = <C extends ElementType = 'blockquote'>(
  props: BlockquoteProps<C>,
) => React.ReactElement | null;

/** Quoted passage — reuses `Text`'s CSS directly (see `Heading`) with a `<blockquote>` default, a left accent border, and italic styling. */
export const Blockquote = forwardRef(function Blockquote<C extends ElementType = 'blockquote'>(
  {
    as,
    className,
    size = 'md',
    color = 'secondary',
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    children,
    ...rest
  }: BlockquoteProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'blockquote';

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const blockquoteElement = (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.blockquote, !showAI && className)}
      data-size={size}
      data-weight="regular"
      data-color={color}
      {...rest}
    >
      {children}
    </Component>
  );

  if (!showAI) return blockquoteElement;

  const text = nodeToText(children);

  return (
    <span className={mergeClasses(styles.aiWrapper, className)}>
      {blockquoteElement}
      <span className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiExplainLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(text) });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(text) })}
        />
      </span>
    </span>
  );
}) as unknown as BlockquoteComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Blockquote as any).displayName = 'Blockquote';
