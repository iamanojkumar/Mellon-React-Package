import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import type { ButtonSize, ButtonVariant } from '../Button/Button';
import { Dropdown } from '../Dropdown/Dropdown';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './SplitButton.module.css';

export interface SplitButtonProps {
  /** The primary button's label. */
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** `Dropdown.Item` elements for the secondary-actions menu. */
  menu: ReactNode;
  /** Accessible label for the menu-toggle button. Defaults to "More actions". */
  menuLabel?: string;
  /** Accessible label for the group wrapping both buttons, e.g. "Save actions". */
  groupLabel?: string;
  className?: string;
}

/**
 * A primary `Button` plus an attached chevron that opens a `Dropdown` menu
 * of related secondary actions (e.g. "Save" next to "Save as...", "Save
 * and close"). Composes `Button` and `Dropdown` directly rather than
 * reimplementing either — `Dropdown.Trigger` is rendered `as={Button}`
 * (polymorphic `as` accepts a component, not just a tag name), so the
 * chevron gets `Button`'s variant/size styling and `Dropdown`'s existing
 * open/close/keyboard-nav logic for free.
 *
 * The two buttons visually join into one control (shared height, no gap,
 * only the outer corners rounded) via CSS overrides scoped as
 * `.splitButton .primary`/`.splitButton .chevron` — two classes, not one,
 * so the override reliably beats `Button.module.css`'s single-class
 * `.button` rule regardless of which CSS module happens to load first
 * (same-specificity rules are otherwise import-order-dependent).
 */
export function SplitButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  menu,
  menuLabel = 'More actions',
  groupLabel,
  className,
}: SplitButtonProps) {
  return (
    <div
      role="group"
      aria-label={groupLabel}
      className={mergeClasses(styles.splitButton, className)}
    >
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        onClick={onClick}
        className={styles.primary}
      >
        {children}
      </Button>
      <Dropdown>
        <Dropdown.Trigger
          as={Button}
          variant={variant}
          size={size}
          disabled={disabled || loading}
          aria-label={menuLabel}
          className={styles.chevron}
        >
          ▾
        </Dropdown.Trigger>
        <Dropdown.Menu placement="bottom-end">{menu}</Dropdown.Menu>
      </Dropdown>
    </div>
  );
}

SplitButton.displayName = 'SplitButton';
