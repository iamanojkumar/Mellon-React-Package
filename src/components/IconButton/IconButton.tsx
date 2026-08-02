import React, { forwardRef } from 'react';
import type { ElementType, ForwardRefRenderFunction } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { mergeClasses } from '../../utilities/mergeClasses';
import buttonStyles from '../Button/Button.module.css';
import type { ButtonSize, ButtonVariant } from '../Button/Button';
import styles from './IconButton.module.css';

export type IconButtonShape = 'square' | 'circle';

export interface IconButtonOwnProps {
  /** Required — an icon-only button has no visible text to fall back on for its accessible name. */
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: IconButtonShape;
  disabled?: boolean;
  /** Shows an inline spinner, sets aria-busy, and forces disabled. */
  loading?: boolean;
  /** Native button `type`. Ignored when `as` overrides to a non-button element. */
  type?: 'button' | 'submit' | 'reset';
}

export type IconButtonProps<C extends ElementType = 'button'> = PolymorphicComponentPropWithRef<
  C,
  IconButtonOwnProps
>;

type IconButtonComponent = <C extends ElementType = 'button'>(
  props: IconButtonProps<C>,
) => React.ReactElement | null;

// `'aria-label'` is required on IconButtonOwnProps, which trips up forwardRef's
// generic type-checking the same way `level` does on `Heading` — see that
// component for why the render function is cast below instead of passed
// directly to `forwardRef`.
function IconButtonRender<C extends ElementType = 'button'>(
  {
    as,
    className,
    variant = 'secondary',
    size = 'md',
    shape = 'square',
    disabled = false,
    loading = false,
    type = 'button',
    children,
    ...rest
  }: IconButtonProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'button';
  const isNativeButton = Component === 'button';
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      className={mergeClasses(buttonStyles.button, styles.iconButton, className)}
      data-variant={variant}
      data-size={size}
      data-shape={shape}
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

/** Icon-only `Button` — reuses `Button`'s CSS directly (see `Heading`) for identical variant/size/loading rendering, with square dimensions (or `shape="circle"`) instead of text padding. */
export const IconButton = forwardRef(
  IconButtonRender as unknown as ForwardRefRenderFunction<
    Element,
    Omit<IconButtonProps<ElementType>, 'ref'>
  >,
) as unknown as IconButtonComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(IconButton as any).displayName = 'IconButton';
