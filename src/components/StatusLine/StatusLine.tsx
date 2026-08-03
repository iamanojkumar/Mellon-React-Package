import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import spinnerStyles from '../Spinner/Spinner.module.css';
import styles from './StatusLine.module.css';

export interface StatusLineOwnProps {
  /** The status text, e.g. "Searching the web…" — also this element's accessible name via role="status". */
  children: ReactNode;
  /** Overrides the default spinning-dot icon (e.g. a tool-specific glyph). Purely decorative either way — the announced content is `children`. */
  icon?: ReactNode;
}

export type StatusLineProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  StatusLineOwnProps;

/**
 * A single labeled line for a transient AI-turn status ("Searching the
 * web…", "Reading 3 pages…", "Drafting a response…") — `role="status"` so
 * assistive tech announces it as the text changes, same live-region
 * pattern `Spinner` uses. The default icon reuses `Spinner`'s CSS class
 * directly rather than the `Spinner` component, since a second nested
 * `role="status"` inside this one would double-announce the same moment;
 * the icon stays purely decorative (`aria-hidden`).
 */
export const StatusLine = forwardRef<HTMLDivElement, StatusLineProps>(function StatusLine(
  { className, icon, children, ...rest },
  ref,
) {
  return (
    <div ref={ref} role="status" className={mergeClasses(styles.line, className)} {...rest}>
      <span className={styles.icon} aria-hidden="true">
        {icon ?? <span className={spinnerStyles.spinner} data-size="sm" />}
      </span>
      <span className={styles.text}>{children}</span>
    </div>
  );
});

StatusLine.displayName = 'StatusLine';
