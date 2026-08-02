import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './ErrorMessage.module.css';

export type ErrorMessageProps<C extends ElementType = 'div'> = PolymorphicComponentPropWithRef<C>;

type ErrorMessageComponent = <C extends ElementType = 'div'>(
  props: ErrorMessageProps<C>,
) => React.ReactElement | null;

/**
 * Standalone validation-error copy for a form control — extracted out of
 * `Field`'s inline rendering (see docs/SPEC.md's Phase 4 notes) so custom
 * form layouts outside `Field` can render the same styling directly. No
 * `role="alert"` by default: `Field` wires this to a control via
 * `aria-describedby`, which screen readers already announce on focus —
 * adding a live region on top would double-announce it. Render inside a
 * live region yourself if you need the error announced the instant it
 * appears (e.g. after an async submit), independent of focus.
 */
export const ErrorMessage = forwardRef(function ErrorMessage<C extends ElementType = 'div'>(
  { as, className, ...rest }: ErrorMessageProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'div';
  return <Component ref={ref} className={mergeClasses(styles.errorMessage, className)} {...rest} />;
}) as unknown as ErrorMessageComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ErrorMessage as any).displayName = 'ErrorMessage';
