import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './HelperText.module.css';

export type HelperTextProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<C>;

type HelperTextComponent = <C extends ElementType = 'div'>(
  props: HelperTextProps<C>,
) => React.ReactElement | null;

/**
 * Standalone supporting-copy text for a form control — extracted out of
 * `Field`'s inline rendering (see docs/SPEC.md's Phase 4 notes) so custom
 * form layouts outside `Field` can render the same styling directly, e.g.
 * `<HelperText id={describedById}>...</HelperText>` wired to a control's
 * `aria-describedby` by hand. `Field` itself now composes this rather than
 * duplicating its styles.
 */
export const HelperText = forwardRef(function HelperText<C extends ElementType = 'div'>(
  { as, className, ...rest }: HelperTextProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';
  return <Component ref={ref} className={mergeClasses(styles.helperText, className)} {...rest} />;
}) as unknown as HelperTextComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(HelperText as any).displayName = 'HelperText';
