import React, { forwardRef } from 'react';
import type { ElementType, ForwardRefRenderFunction } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import buttonStyles from '../Button/Button.module.css';
import type { ButtonVariant } from '../Button/Button';
import styles from './FloatingActionButton.module.css';

export type FloatingActionButtonSize = 'md' | 'lg';

export interface FloatingActionButtonOwnProps {
  /** Required — an icon-only button has no visible text to fall back on for its accessible name. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: FloatingActionButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Fixes the button to the bottom-right corner of the viewport. Defaults to `false` — positioning is otherwise the consumer's call (e.g. inside a relatively-positioned page region). */
  fixed?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export type FloatingActionButtonProps<C extends ElementType = 'button'> =
  PolymorphicComponentPropWithRef<C, FloatingActionButtonOwnProps>;

type FloatingActionButtonComponent = <C extends ElementType = 'button'>(
  props: FloatingActionButtonProps<C>,
) => React.ReactElement | null;

// Same `'aria-label'`-is-required workaround as `IconButton`/`Heading`.
function FloatingActionButtonRender<C extends ElementType = 'button'>(
  {
    as,
    className,
    variant = 'primary',
    size = 'lg',
    disabled = false,
    loading = false,
    fixed = false,
    type = 'button',
    children,
    ...rest
  }: FloatingActionButtonProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'button';
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={mergeClasses(buttonStyles.button, styles.fab, className)}
      data-variant={variant}
      data-size={size}
      data-fixed={fixed || undefined}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...(isNativeButton
        ? { type, disabled: isDisabled || undefined }
        : { 'aria-disabled': isDisabled || undefined })}
      {...rest}
    >
      {loading ? <span className={buttonStyles.spinner} aria-hidden="true" /> : children}
    </Component>
  );
}

/**
 * Circular, elevated, icon-only `Button` for a screen's single primary
 * action — reuses `Button`'s CSS directly (see `Heading`), always
 * `shape="circle"` (unlike `IconButton`, which supports both), and always
 * carries a shadow (`box-shadow: var(--ds-elevation-md)`) since "floating"
 * implies visibly raised above the page.
 */
export const FloatingActionButton = forwardRef(
  FloatingActionButtonRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<FloatingActionButtonProps<ElementType>, 'ref'>
  >,
) as unknown as FloatingActionButtonComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(FloatingActionButton as any).displayName = 'FloatingActionButton';
