import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import badgeStyles from '../Badge/Badge.module.css';
import styles from './CitationMarker.module.css';

export interface CitationMarkerOwnProps {
  /** The citation number/label shown inside the marker, e.g. `1`. */
  index: number | string;
  /**
   * Accessible label for assistive tech, e.g. `"Source 1: MDN Web Docs"`.
   * Defaults to `"Citation {index}"` — the visible number alone isn't a
   * useful accessible name on its own.
   */
  label?: string;
  /** Jumps to an in-page footnote/source-list anchor. Renders an `<a>`. */
  href?: string;
  /** Opens a citation detail (e.g. a `CitationCard`). Renders a `<button>`. Ignored when `href` is given. */
  onClick?: () => void;
}

export type CitationMarkerProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  keyof CitationMarkerOwnProps
> &
  CitationMarkerOwnProps;

/**
 * A small inline reference marker (e.g. `[1]`) attached to AI response text
 * — distinct from the fuller footnote/source `CitationCard` a marker can
 * open, which is a separate later component. Reuses `Badge`'s pill styling
 * (`.badge`) directly rather than duplicating it, since a citation marker
 * is visually just a very small brand-colored badge; its own module only
 * adds the smaller sizing/line-height a superscript-style marker needs.
 *
 * Renders a real `<a>` when `href` is given (footnote-anchor pattern), a
 * `<button>` when only `onClick` is given, or a plain `<span>` when
 * neither is — still labeled, since even a non-interactive marker should
 * announce which source it points to.
 */
export const CitationMarker = forwardRef<
  HTMLAnchorElement | HTMLButtonElement | HTMLSpanElement,
  CitationMarkerProps
>(function CitationMarker({ className, index, label, href, onClick, ...rest }, ref) {
  const accessibleLabel = label ?? `Citation ${index}`;
  const sharedClassName = mergeClasses(badgeStyles.badge, styles.marker, className);

  if (href) {
    return (
      <a
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        href={href}
        className={sharedClassName}
        data-variant="solid"
        data-color="brand"
        aria-label={accessibleLabel}
        {...rest}
      >
        {index}
      </a>
    );
  }

  if (onClick) {
    return (
      <button
        ref={ref as React.ForwardedRef<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={sharedClassName}
        data-variant="solid"
        data-color="brand"
        aria-label={accessibleLabel}
        {...rest}
      >
        {index}
      </button>
    );
  }

  return (
    <span
      ref={ref as React.ForwardedRef<HTMLSpanElement>}
      className={sharedClassName}
      data-variant="solid"
      data-color="brand"
      aria-label={accessibleLabel}
      {...rest}
    >
      {index}
    </span>
  );
});

CitationMarker.displayName = 'CitationMarker';
