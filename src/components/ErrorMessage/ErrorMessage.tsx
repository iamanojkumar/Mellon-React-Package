import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './ErrorMessage.module.css';

export interface ErrorMessageOwnProps {
  /**
   * Adds an AI-powered "Explain with AI" trigger next to the error text —
   * explains the likely cause and suggests a fix. Off by default, and a
   * no-op even when `true` unless an ancestor `AIProvider` is mounted —
   * the rendered output is byte-identical to today's whenever this
   * doesn't apply. Read-only: no accept/reject, since an explanation
   * isn't something to replace the error text with (same shape as
   * `Alert`'s `aiExplain`).
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the error's text content. Defaults to a generic cause/fix instruction. */
  buildAIPrompt?: (text: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

export type ErrorMessageProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  ErrorMessageOwnProps
>;

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt(text: string): string {
  return `Explain the likely cause of this validation error and suggest a fix:\n\n${text}`;
}

type ErrorMessageComponent = <C extends ElementType = 'div'>(
  props: ErrorMessageProps<C>,
) => React.ReactElement | null;

/**
 * Standalone validation-error copy for a form control — extracted out of
 * `Field`'s inline rendering (see docs/SPEC.md's Phase 4 notes) so custom
 * form layouts outside `Field` can render the same styling directly. No
 * `role="alert"` by default: `Field` wires this to a control via
 * `aria-describedby`, which screen readers already announce on focus —
 * adding a live region on top would double-announce it. Render inside a
 * live region yourself if you need the error announced the instant it
 * appears (e.g. after an async submit), independent of focus.
 */
export const ErrorMessage = forwardRef(function ErrorMessage<C extends ElementType = 'div'>(
  {
    as,
    className,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    children,
    ...rest
  }: ErrorMessageProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const errorElement = (
    <Component
      ref={ref}
      className={mergeClasses(styles.errorMessage, !showAI && className)}
      {...rest}
    >
      {children}
    </Component>
  );

  if (!showAI) return errorElement;

  const text = nodeToText(children);

  return (
    <span className={mergeClasses(styles.aiWrapper, className)}>
      {errorElement}
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
}) as unknown as ErrorMessageComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ErrorMessage as any).displayName = 'ErrorMessage';
