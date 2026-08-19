import React, { forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Panel.module.css';

export type PanelDock = 'start' | 'end';

export interface PanelOwnProps {
  /**
   * Which edge the panel sits flush against — purely which side loses its
   * border (docked-to content has no border facing the content it's docked
   * to). Actual placement in the layout (flex order, fixed positioning) is
   * the consumer's own layout, same as `Sidebar`. Defaults to `'end'`
   * (right in LTR, left in RTL).
   */
  dock?: PanelDock;
  /** Optional heading row, pinned above the scrollable body. */
  header?: ReactNode;
  /** Optional row pinned below the scrollable body — the usual place for actions. */
  footer?: ReactNode;
}

export type PanelProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<
  C,
  PanelOwnProps
>;

type PanelComponent = <C extends ElementType = 'div'>(
  props: PanelProps<C>,
) => React.ReactElement | null;

/**
 * A persistent, non-modal container meant to dock at a viewport edge and
 * fill its height — the property-panel/inspector pattern (WordPress block
 * editor, Figma, Elementor). Deliberately **not** `Drawer`: a `Drawer`
 * renders through a `Portal`, traps focus, and closes on backdrop click,
 * which is right for a transient overlay and wrong for a panel meant to stay
 * open while the user keeps interacting with whatever it's docked beside.
 * Stays in the normal document flow like `Sidebar`'s default (non-drawer)
 * mode, just with arbitrary `children` instead of a fixed nav-item API.
 *
 * `header`/`footer` are pinned rows around a scrollable body — the same
 * three-region shape as `Dialog.Header`/`.Body`/`.Footer`, reimplemented
 * rather than reused because `Dialog`'s header reserves space for its
 * absolute-positioned close button, which a docked panel has no reason to
 * carry.
 */
export const Panel = forwardRef(function Panel<C extends ElementType = 'div'>(
  { as, className, dock = 'end', header, footer, children, ...rest }: PanelProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.panel, className)}
      data-dock={dock}
      {...rest}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </Component>
  );
}) as unknown as PanelComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Panel as any).displayName = 'Panel';
