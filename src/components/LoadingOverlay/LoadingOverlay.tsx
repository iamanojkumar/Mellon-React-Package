import { forwardRef, useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { Portal } from '../Portal/Portal';
import { Spinner } from '../Spinner/Spinner';
import type { SpinnerSize } from '../Spinner/Spinner';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './LoadingOverlay.module.css';

export interface LoadingOverlayOwnProps {
  /** `true` (default): `Portal`-rendered, fixed to the viewport, covers the whole page. `false`: `position: absolute; inset: 0` — the nearest `position: relative` ancestor becomes the covered area; that ancestor is the consumer's responsibility to set, same as `Popover`'s anchor requirement. */
  fullScreen?: boolean;
  size?: SpinnerSize;
  /** Visible text under the spinner, and the accessible name for the overlay's `role="status"` region. Omit for an icon-only overlay (still announced via a visually-hidden "Loading"). */
  label?: ReactNode;
}

export type LoadingOverlayProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  LoadingOverlayOwnProps;

/**
 * Reuses `Spinner` directly rather than reimplementing a rotating
 * indicator. `Spinner` normally owns `role="status"`/`aria-label` itself,
 * but here it's demoted to purely decorative (`role="presentation"
 * aria-hidden="true"`, both passed through its own prop-spread) — the
 * *overlay's own root* is the single `role="status"` region instead, so a
 * screen reader announces the label once, not twice (one region owning
 * `label`, not two nested live regions racing each other).
 */
export const LoadingOverlay = forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay({ className, fullScreen = true, size = 'lg', label, ...rest }, ref) {
    // `role="status"` isn't a name-from-content role — an accessible name
    // still needs an explicit `aria-labelledby` pointing at the label
    // text, whether that's the visible `label` or the visually-hidden
    // "Loading" fallback.
    const labelId = useId();
    const overlay = (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-labelledby={labelId}
        className={mergeClasses(styles.overlay, className)}
        data-full-screen={fullScreen}
        {...rest}
      >
        <Spinner size={size} role="presentation" aria-hidden="true" />
        {label ? (
          <span id={labelId} className={styles.label}>
            {label}
          </span>
        ) : (
          <VisuallyHidden id={labelId}>Loading</VisuallyHidden>
        )}
      </div>
    );

    return fullScreen ? <Portal>{overlay}</Portal> : overlay;
  },
);

LoadingOverlay.displayName = 'LoadingOverlay';
