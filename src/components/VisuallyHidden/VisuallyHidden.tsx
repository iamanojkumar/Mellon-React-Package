import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './VisuallyHidden.module.css';

export type VisuallyHiddenProps<C extends ElementType = 'span'> =
  PolymorphicComponentPropWithRef<C>;

type VisuallyHiddenComponent = <C extends ElementType = 'span'>(
  props: VisuallyHiddenProps<C>,
) => React.ReactElement | null;

/**
 * Hides content visually while keeping it in the accessibility tree — the
 * standard clip-based technique, not `display: none`/`visibility: hidden`
 * (both of which remove content from the a11y tree too). For content only
 * screen-reader users need (e.g. an icon-only button's accessible name).
 */
export const VisuallyHidden = forwardRef(function VisuallyHidden<C extends ElementType = 'span'>(
  { as, className, ...rest }: VisuallyHiddenProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'span';
  return (
    <Component ref={ref} className={mergeClasses(styles.visuallyHidden, className)} {...rest} />
  );
}) as unknown as VisuallyHiddenComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(VisuallyHidden as any).displayName = 'VisuallyHidden';
