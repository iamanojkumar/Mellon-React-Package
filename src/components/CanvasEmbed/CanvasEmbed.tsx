import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './CanvasEmbed.module.css';

export interface CanvasEmbedOwnProps {
  /** External page to embed. Takes precedence over `html`. */
  url?: string;
  /** Raw HTML, rendered via `srcDoc` inside the same sandbox. */
  html?: string;
  /** Required — an untitled iframe is unreachable by screen reader. */
  title: string;
}

export type CanvasEmbedProps = Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'title'> &
  CanvasEmbedOwnProps;

/**
 * Third-party or authored HTML, isolated in a sandboxed iframe.
 *
 * **The security shape is the point of this component.** Content is never
 * passed through `dangerouslySetInnerHTML` — it goes into an iframe whose
 * `sandbox` grants `allow-scripts` but deliberately **not**
 * `allow-same-origin`. Granting both together is equivalent to removing the
 * sandbox: the frame could reach into the parent document and strip its own
 * sandbox attribute. Without `allow-same-origin` the frame gets an opaque
 * origin and cannot touch the host page, its storage or its cookies.
 *
 * `referrerpolicy="no-referrer"` keeps the host URL out of the embedded
 * request, since a canvas URL often names a private workspace.
 */
export const CanvasEmbed = forwardRef<HTMLDivElement, CanvasEmbedProps>(function CanvasEmbed(
  { url, html, title, className, ...rest },
  ref,
) {
  const hasContent = Boolean(url || html);

  return (
    <div ref={ref} className={mergeClasses(styles.embed, className)} {...rest}>
      {hasContent ? (
        <iframe
          className={styles.frame}
          title={title}
          sandbox="allow-scripts allow-forms allow-popups"
          referrerPolicy="no-referrer"
          loading="lazy"
          {...(url ? { src: url } : { srcDoc: html })}
        />
      ) : (
        <p className={styles.empty}>Nothing embedded</p>
      )}
    </div>
  );
});

CanvasEmbed.displayName = 'CanvasEmbed';
