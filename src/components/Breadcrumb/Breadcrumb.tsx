import React, { Children, forwardRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import textStyles from '../Text/Text.module.css';
import styles from './Breadcrumb.module.css';

export interface BreadcrumbProps {
  /** Rendered between each item, hidden from assistive tech. Defaults to `'/'`. */
  separator?: ReactNode;
  /** Defaults to `'Breadcrumb'`. */
  'aria-label'?: string;
  /** `Breadcrumb.Item` elements. */
  children: ReactNode;
  className?: string;
}

/**
 * `<nav aria-label="Breadcrumb"><ol>...</ol></nav>` — the WAI-ARIA APG
 * breadcrumb pattern. No roving-tabindex keyboard nav (unlike `Tabs`/
 * `Accordion`): a breadcrumb trail is a list of independent page links, not
 * a single composite widget, so each link stays in the normal tab order —
 * the same reasoning `Pagination` follows for the same shape of question.
 * Separators are real DOM content (not CSS `::before`) so they can be an
 * icon, not just a character, but stay `aria-hidden` either way since
 * they're purely decorative.
 */
function BreadcrumbRoot({
  separator = '/',
  'aria-label': ariaLabel = 'Breadcrumb',
  children,
  className,
}: BreadcrumbProps) {
  const items = Children.toArray(children);

  return (
    <nav aria-label={ariaLabel} className={mergeClasses(styles.breadcrumb, className)}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li className={styles.listItem} key={index}>
            {item}
            {index < items.length - 1 && (
              <span className={styles.separator} aria-hidden="true">
                {separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface BreadcrumbItemOwnProps {
  /** Marks this as the current page: renders as a non-interactive `<span>` (ignoring `as`/`href`) with `aria-current="page"` instead of a link. */
  current?: boolean;
}

export type BreadcrumbItemProps<C extends ElementType = 'a'> = PolymorphicComponentPropWithRef<
  C,
  BreadcrumbItemOwnProps
>;

type BreadcrumbItemComponent = <C extends ElementType = 'a'>(
  props: BreadcrumbItemProps<C>,
) => React.ReactElement | null;

const BreadcrumbItem = forwardRef(function BreadcrumbItem<C extends ElementType = 'a'>(
  { as, className, current = false, ...rest }: BreadcrumbItemProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = current ? 'span' : (as ?? 'a');

  return (
    <Component
      ref={ref}
      className={mergeClasses(textStyles.text, styles.item, className)}
      data-current={current || undefined}
      aria-current={current ? 'page' : undefined}
      {...rest}
    />
  );
}) as unknown as BreadcrumbItemComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BreadcrumbItem as any).displayName = 'Breadcrumb.Item';

/**
 * Compound component: `<Breadcrumb><Breadcrumb.Item href="/">Home</Breadcrumb.Item><Breadcrumb.Item current>Widget</Breadcrumb.Item></Breadcrumb>`.
 * `Breadcrumb.Item` is also individually named-exported — see docs/SPEC.md
 * for the compound-component convention.
 */
export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  Item: BreadcrumbItem,
  displayName: 'Breadcrumb',
});

export { BreadcrumbItem };
