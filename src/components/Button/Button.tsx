import React, { forwardRef } from 'react';
import type { ElementType } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Shows an inline spinner, sets aria-busy, and forces disabled. */
  loading?: boolean;
  /** Native button `type`. Ignored when `as` overrides to a non-button element. */
  type?: 'button' | 'submit' | 'reset';
}

export type ButtonProps<C extends ElementType = 'button'> = PolymorphicComponentPropWithRef<
  C,
  ButtonOwnProps
>;

type ButtonComponent = <C extends ElementType = 'button'>(
  props: ButtonProps<C>,
) => React.ReactElement | null;

/**
 * `disabled` only becomes a real DOM attribute when rendered as a native
 * `<button>` — non-button elements (e.g. `as="a"`) get `aria-disabled` plus
 * a CSS treatment instead, since HTML has no `disabled` attribute for them.
 */
export const Button = forwardRef(function Button<C extends ElementType = 'button'>(
  {
    as,
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    children,
    ...rest
  }: ButtonProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'button';
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={mergeClasses(styles.button, className)}
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...(isNativeButton
        ? { type, disabled: isDisabled || undefined }
        : { 'aria-disabled': isDisabled || undefined })}
      {...rest}
    >
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </Component>
  );
}) as unknown as ButtonComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Button as any).displayName = 'Button';
