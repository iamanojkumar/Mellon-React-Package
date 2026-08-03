import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AlertVariantIcon } from '../Alert/Alert';
import type { AlertVariant } from '../Alert/Alert';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import alertStyles from '../Alert/Alert.module.css';
import styles from './Banner.module.css';

export type BannerVariant = AlertVariant;

export interface BannerBuildAIPromptProps {
  variant: BannerVariant;
  children?: ReactNode;
}

export interface BannerOwnProps {
  variant?: BannerVariant;
  /** Shows a "×" dismiss button and calls this when it's activated. Omit for a non-dismissible banner. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  children?: ReactNode;
  /**
   * Adds an AI-powered "Explain with AI" affordance next to the dismiss
   * button — same shape as its sibling `Alert`'s `aiExplain`: a trigger
   * opening an `AISuggestionPopover` with the likely cause/impact/fix. Off
   * by default, and a no-op even when `true` unless an ancestor
   * `AIProvider` is mounted — the rendered output is byte-identical to
   * today's whenever this doesn't apply. Read-only: no accept/reject.
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from this banner's variant/children. Defaults to a generic cause/impact/fix instruction. */
  buildAIPrompt?: (props: BannerBuildAIPromptProps) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

export type BannerProps = ComponentPropsWithoutRef<'div'> & BannerOwnProps;

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' ? node : '';
}

function defaultBuildAIPrompt({ variant, children }: BannerBuildAIPromptProps): string {
  const lines = [`Banner variant: ${variant}`];
  const messageText = nodeToText(children);
  if (messageText) lines.push(`Message: ${messageText}`);
  lines.push('Explain the likely cause, the impact, and a suggested fix.');
  return lines.join('\n');
}

/**
 * `Alert`'s full-width, page-level sibling — same variant language,
 * different shape: edge-to-edge, no border-radius, no per-side border (a
 * banner sits flush against whatever contains it, typically the very top
 * of a page or section, not floating as a rounded card the way `Alert`
 * does). No `title` prop — a banner is a single, usually short, line of
 * text, not a titled block.
 *
 * Reuses `AlertVariantIcon` directly for the four SVG shapes (the actual
 * duplication risk) and `Alert.module.css`'s standalone `.dismissButton`
 * rules (no ancestor dependency, safe to import as-is). Icon *coloring*
 * is its own local rule here, not `Alert.module.css`'s `.icon` — that
 * rule is written as a descendant selector, `.alert[data-variant='...']
 * .icon`, which only matches inside an element that itself carries
 * `Alert`'s own `.alert` class; reusing it directly here would have
 * silently done nothing; the icon would render uncolored, no error.
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    className,
    variant = 'info',
    onDismiss,
    dismissLabel = 'Dismiss',
    children,
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

  const dismissButton = onDismiss && (
    <button
      type="button"
      className={alertStyles.dismissButton}
      aria-label={dismissLabel}
      onClick={onDismiss}
    >
      ×
    </button>
  );

  const aiTrigger = showAI && (
    <AISuggestionPopover
      triggerLabel={aiExplainLabel}
      status={aiAction.status}
      result={aiAction.result}
      error={aiAction.error}
      onOpenChange={(open) => {
        if (open) {
          aiAction.trigger({ prompt: buildAIPrompt({ variant, children }) });
        } else {
          aiAction.reset();
        }
      }}
      onRetry={() => aiAction.trigger({ prompt: buildAIPrompt({ variant, children }) })}
    />
  );

  return (
    <div
      ref={ref}
      role={variant === 'warning' || variant === 'danger' ? 'alert' : 'status'}
      className={mergeClasses(styles.banner, className)}
      data-variant={variant}
      {...rest}
    >
      <span className={styles.icon}>
        <AlertVariantIcon variant={variant} />
      </span>
      <div className={styles.content}>{children}</div>
      {showAI ? (
        <div className={styles.actions}>
          {aiTrigger}
          {dismissButton}
        </div>
      ) : (
        dismissButton
      )}
    </div>
  );
});

Banner.displayName = 'Banner';
