import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { AlertVariantIcon } from '../Alert/Alert';
import type { AlertVariant } from '../Alert/Alert';
import alertStyles from '../Alert/Alert.module.css';
import styles from './Banner.module.css';

export type BannerVariant = AlertVariant;

export interface BannerOwnProps {
  variant?: BannerVariant;
  /** Shows a "×" dismiss button and calls this when it's activated. Omit for a non-dismissible banner. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  children?: ReactNode;
}

export type BannerProps = ComponentPropsWithoutRef<'div'> & BannerOwnProps;

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
  { className, variant = 'info', onDismiss, dismissLabel = 'Dismiss', children, ...rest },
  ref,
) {
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
      {onDismiss && (
        <button
          type="button"
          className={alertStyles.dismissButton}
          aria-label={dismissLabel}
          onClick={onDismiss}
        >
          ×
        </button>
      )}
    </div>
  );
});

Banner.displayName = 'Banner';
