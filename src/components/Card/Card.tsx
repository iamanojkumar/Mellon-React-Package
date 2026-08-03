import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { resolveSpace } from '../../utilities/resolveSpace';
import type { SpaceValue } from '../../utilities/resolveSpace';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Card.module.css';

export type CardVariant = 'elevated' | 'outlined';
export type CardElevation = 'sm' | 'md' | 'lg';

export interface CardOwnProps {
  padding?: SpaceValue;
  variant?: CardVariant;
  /** Only applies to the 'elevated' variant. */
  elevation?: CardElevation;
  /**
   * Adds an AI-powered "Explain with AI" trigger overlaid on the card —
   * summarizes/explains the card's content. Off by default, and a no-op
   * even when `true` unless an ancestor `AIProvider` is mounted — the
   * rendered output is byte-identical to today's whenever this doesn't
   * apply. Read-only: no accept/reject, since a summary isn't something
   * to replace the card's own content with (same shape as `Alert`'s
   * `aiExplain`). Only string `children` contribute to the default
   * prompt's text (same scope `Alert`/`Code` already accept) — pass your
   * own `buildAIPrompt` if the card's content is more structured.
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the card's text content. Defaults to a generic summarize/explain instruction. */
  buildAIPrompt?: (text: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt(text: string): string {
  return `Summarize and explain the following card content:\n\n${text}`;
}

export type CardProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  CardOwnProps
>;

type CardComponent = <C extends ElementType = 'div'>(
  props: CardProps<C>,
) => React.ReactElement | null;

/** Content container. Composes `resolveSpace` for a single `padding` prop — a
 * simpler API than Box/Flex/Grid's full spacing set, since Card is a
 * container, not a layout primitive. */
export const Card = forwardRef(function Card<C extends ElementType = 'div'>(
  {
    as,
    className,
    style,
    padding = 'md',
    variant = 'elevated',
    elevation = 'sm',
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    children,
    ...rest
  }: CardProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const cardStyle: React.CSSProperties = {
    padding: resolveSpace(padding),
    ...style,
  };

  const cardElement = (
    <Component
      ref={ref}
      className={mergeClasses(styles.card, !showAI && className)}
      style={cardStyle}
      data-variant={variant}
      data-elevation={variant === 'elevated' ? elevation : undefined}
      {...rest}
    >
      {children}
    </Component>
  );

  if (!showAI) return cardElement;

  const text = nodeToText(children);

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {cardElement}
      <div className={styles.aiTrigger}>
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
      </div>
    </div>
  );
}) as unknown as CardComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Card as any).displayName = 'Card';
