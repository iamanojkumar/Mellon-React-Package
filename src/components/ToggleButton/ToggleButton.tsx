import React, { forwardRef } from 'react';
import type { ElementType, MouseEvent } from 'react';
import type { PolymorphicComponentPropWithRef } from '../../types/polymorphic';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import buttonStyles from '../Button/Button.module.css';
import type { ButtonSize, ButtonVariant } from '../Button/Button';
import styles from './ToggleButton.module.css';

export interface ToggleButtonOwnProps {
  /** The unpressed look. The pressed look is always the same brand highlight, regardless of `variant` — the common toolbar-toggle convention (e.g. a bold/italic toggle). */
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  type?: 'button' | 'submit' | 'reset';
}

export type ToggleButtonProps<C extends ElementType = 'button'> = PolymorphicComponentPropWithRef<
  C,
  ToggleButtonOwnProps
>;

type ToggleButtonComponent = <C extends ElementType = 'button'>(
  props: ToggleButtonProps<C>,
) => React.ReactElement | null;

/** Reuses `Button`'s CSS directly (see `Heading`) for identical base/variant/size/disabled rendering, adding controllable `aria-pressed` state and a `data-pressed` highlight on top. */
export const ToggleButton = forwardRef(function ToggleButton<C extends ElementType = 'button'>(
  {
    as,
    className,
    variant = 'secondary',
    size = 'md',
    disabled = false,
    pressed,
    defaultPressed = false,
    onPressedChange,
    type = 'button',
    onClick,
    ...rest
  }: ToggleButtonProps<C>,
  ref: React.ForwardedRef<Element>,
) {
  const Component = as || 'button';
  const isNativeButton = Component === 'button';
  const [isPressed, setIsPressed] = useControllableState<boolean>({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  });

  function handleClick(event: MouseEvent) {
    setIsPressed(!isPressed);
    onClick?.(event as never);
  }

  return (
    <Component
      ref={ref}
      className={mergeClasses(buttonStyles.button, styles.toggleButton, className)}
      data-variant={variant}
      data-size={size}
      data-pressed={isPressed}
      aria-pressed={isPressed}
      onClick={handleClick}
      {...(isNativeButton
        ? { type, disabled: disabled || undefined }
        : { 'aria-disabled': disabled || undefined })}
      {...rest}
    />
  );
}) as unknown as ToggleButtonComponent;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(ToggleButton as any).displayName = 'ToggleButton';
