import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Image.module.css';

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface ImageAIDescribeContext {
  src?: string;
}

export interface ImageOwnProps {
  /** Required — pass `alt=""` explicitly for a purely decorative image, rather than omitting it. */
  alt: string;
  fit?: ImageFit;
  /** Width divided by height, e.g. `16 / 9`. Omit to size naturally. */
  ratio?: number;
  /** Rounds the corners. Defaults to `false`. */
  rounded?: boolean;
  /**
   * Adds an AI-powered "Describe with AI" trigger next to the image —
   * suggests alt-text/caption via a vision-capable `AIClient` (the `src`
   * is forwarded through `AICompleteOptions.context`, an opaque pass-
   * through bag this library never inspects). Off by default, and a no-op
   * even when `true` unless an ancestor `AIProvider` is mounted — the
   * rendered output is byte-identical to today's whenever this doesn't
   * apply. Read-only: no accept/reject — `alt` stays required and
   * explicit, this only suggests text for a human to copy in.
   */
  aiDescribe?: boolean;
  /** Builds the prompt sent to the AI client from the image's `src`. Defaults to a generic "describe this image for alt text" instruction. */
  buildAIPrompt?: (props: ImageAIDescribeContext) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Describe with AI'`. */
  aiDescribeLabel?: string;
}

export type ImageProps = Omit<ComponentPropsWithoutRef<'img'>, 'alt'> & ImageOwnProps;

function defaultBuildAIPrompt({ src }: ImageAIDescribeContext): string {
  return `Describe this image concisely for use as alt text. Image URL: ${src ?? '(none)'}`;
}

/** `<img>` wrapper with `object-fit`, an optional `aspect-ratio`, and rounded corners. `alt` is required at the type level (unlike native `<img>`) — pass `alt=""` explicitly for decorative images. Not polymorphic — always a real `<img>`. */
export const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  {
    className,
    style,
    alt,
    fit = 'cover',
    ratio,
    rounded = false,
    src,
    aiDescribe = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiDescribeLabel = 'Describe with AI',
    ...rest
  },
  ref,
) {
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiDescribe && !!aiClient;

  const imageElement = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={mergeClasses(styles.image, !showAI && className)}
      style={{ ...(ratio !== undefined && { aspectRatio: String(ratio) }), ...style }}
      data-fit={fit}
      data-rounded={rounded || undefined}
      {...rest}
    />
  );

  if (!showAI) return imageElement;

  return (
    <span className={mergeClasses(styles.aiWrapper, className)}>
      {imageElement}
      <span className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiDescribeLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt({ src }), context: { src } });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt({ src }), context: { src } })}
        />
      </span>
    </span>
  );
});

Image.displayName = 'Image';
