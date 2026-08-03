import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import cardStyles from '../Card/Card.module.css';
import { Caption } from '../Caption/Caption';
import styles from './CitationCard.module.css';

export interface CitationCardOwnProps {
  /** The citation number, matching a `CitationMarker`'s own `index` when the two are paired. */
  index?: number | string;
  title: ReactNode;
  /** Source link. Given a value, the whole card becomes a single `<a>` (real link semantics, not a `<div onClick>`); omitted, it renders a plain `<div>`. */
  href?: string;
  /** The source name/domain, e.g. "developer.mozilla.org". */
  source?: ReactNode;
  /** A short excerpt from the source. */
  snippet?: ReactNode;
}

export type CitationCardProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  keyof CitationCardOwnProps | 'children'
> &
  CitationCardOwnProps;

/**
 * The fuller footnote/source detail a `CitationMarker` can open — distinct
 * from generic `Card`, but reuses its box CSS (`background`/
 * `border-radius`) via a doubled-class override rather than duplicating
 * it, the same pattern `MessageBubble` already established against `Card`.
 */
export const CitationCard = forwardRef<HTMLAnchorElement | HTMLDivElement, CitationCardProps>(
  function CitationCard({ className, index, title, href, source, snippet, ...rest }, ref) {
    const content = (
      <>
        <div className={styles.header}>
          {index !== undefined && <span className={styles.index}>{index}</span>}
          <span className={styles.title}>{title}</span>
        </div>
        {source && <Caption className={styles.source}>{source}</Caption>}
        {snippet && <p className={styles.snippet}>{snippet}</p>}
      </>
    );

    const sharedClassName = mergeClasses(cardStyles.card, styles.card, className);

    if (href) {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          href={href}
          className={sharedClassName}
          data-variant="outlined"
          {...rest}
        >
          {content}
        </a>
      );
    }

    return (
      <div
        ref={ref as React.ForwardedRef<HTMLDivElement>}
        className={sharedClassName}
        data-variant="outlined"
        {...rest}
      >
        {content}
      </div>
    );
  },
);

CitationCard.displayName = 'CitationCard';
