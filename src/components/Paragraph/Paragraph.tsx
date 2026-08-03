import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import textStyles from '../Text/Text.module.css';
import type { TextAlign, TextColor, TextSize, TextWeight } from '../Text/Text';
import styles from './Paragraph.module.css';

export interface ParagraphOwnProps {
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: TextAlign;
  /**
   * Adds an AI-powered "Summarize with AI" trigger next to the paragraph.
   * Off by default, and a no-op even when `true` unless an ancestor
   * `AIProvider` is mounted — the rendered output is byte-identical to
   * today's whenever this doesn't apply. Read-only: no accept/reject,
   * since a summary isn't something to replace the paragraph's own text
   * with (same shape as `Alert`'s `aiExplain`).
   */
  aiSummarize?: boolean;
  /** Builds the prompt sent to the AI client from the paragraph's text content. Defaults to a generic plain-language summary instruction. */
  buildAIPrompt?: (text: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Summarize with AI'`. */
  aiSummarizeLabel?: string;
}

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt(text: string): string {
  return `Summarize the following text in plain language:\n\n${text}`;
}

export type ParagraphProps<C extends ElementType = 'p'> = PolymorphicComponentPropWithRef<
  C,
  ParagraphOwnProps
>;

type ParagraphComponent = <C extends ElementType = 'p'>(
  props: ParagraphProps<C>,
) => React.ReactElement | null;

/** Block-level body copy — reuses `Text`'s CSS directly (see `Heading`), with a `<p>` default and a bit of vertical rhythm (`margin-bottom`) between consecutive paragraphs. */
export const Paragraph = forwardRef(function Paragraph<C extends ElementType = 'p'>(
  {
    as,
    className,
    size = 'md',
    weight = 'regular',
    color = 'primary',
    align,
    aiSummarize = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiSummarizeLabel = 'Summarize with AI',
    children,
    ...rest
  }: ParagraphProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'p';

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiSummarize && !!aiClient;

  const paragraphElement = (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.paragraph, !showAI && className)}
      data-size={size}
      data-weight={weight}
      data-color={color}
      data-align={align}
      {...rest}
    >
      {children}
    </Component>
  );

  if (!showAI) return paragraphElement;

  const text = nodeToText(children);

  return (
    <span className={mergeClasses(styles.aiWrapper, className)}>
      {paragraphElement}
      <span className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiSummarizeLabel}
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
}) as unknown as ParagraphComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Paragraph as any).displayName = 'Paragraph';
