import { forwardRef } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';
import { Dropdown } from '../Dropdown/Dropdown';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { COUNTRY_CODES } from './countryCodes';
import styles from './PhoneField.module.css';

export interface PhoneFieldOwnProps {
  /** ISO 3166-1 alpha-2 code (e.g. `"US"`) for the country-code selector. Controlled. */
  countryCode?: string;
  /** Initial ISO country code for uncontrolled usage. Defaults to `"US"`. */
  defaultCountryCode?: string;
  onCountryCodeChange?: (countryCode: string) => void;
  /**
   * Renders a plain `type="tel"` input with no selector, matching
   * `PhoneField`'s original pre-country-code-selector shape. `value`/
   * `onChange`/`defaultValue` are unaffected either way — they've always
   * been (and stay) just the national number, never the dial code.
   */
  hideCountrySelect?: boolean;
  /** Accessible label prefix for the country selector button; the selected country's name and dial code are appended. Defaults to "Country code". */
  countrySelectLabel?: string;
}

export type PhoneFieldProps = Omit<InputProps, 'type'> & PhoneFieldOwnProps;

/**
 * `Input` with `type="tel"` fixed, plus an attached country dial-code
 * selector (composes `Dropdown` directly — same "reuse existing infra
 * rather than reimplement" call `SplitButton` already made for its own
 * chevron menu; `Select`/Combobox proper are still Phase 9/10, not
 * shipped yet). The dial code is a separate, independently
 * controllable/uncontrollable piece of state (`countryCode`/
 * `defaultCountryCode`/`onCountryCodeChange`) — `value`/`onChange` on the
 * input itself continue to mean only the national number, never a
 * combined "+1 5551234567" string, so this doesn't change what existing
 * `PhoneField` consumers' `value`/`onChange` see. Still no locale-aware
 * masking or number formatting — same scope cut as before, now also
 * covering why the dial code isn't auto-inserted into the typed value.
 */
export const PhoneField = forwardRef<HTMLInputElement, PhoneFieldProps>(function PhoneField(
  {
    className,
    countryCode: countryCodeProp,
    defaultCountryCode = 'US',
    onCountryCodeChange,
    hideCountrySelect = false,
    countrySelectLabel = 'Country code',
    disabled,
    ...rest
  },
  ref,
) {
  const [countryCode, setCountryCode] = useControllableState<string>({
    value: countryCodeProp,
    defaultValue: defaultCountryCode,
    onChange: onCountryCodeChange,
  });

  if (hideCountrySelect) {
    return <Input ref={ref} {...rest} disabled={disabled} type="tel" />;
  }

  const selected = COUNTRY_CODES.find((option) => option.iso === countryCode) ?? COUNTRY_CODES[0]!;

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <Dropdown>
        <Dropdown.Trigger
          className={styles.trigger}
          disabled={disabled}
          aria-label={`${countrySelectLabel}: ${selected.name}, ${selected.dialCode}`}
        >
          <span aria-hidden="true">{selected.dialCode}</span>
          <span className={styles.chevron} aria-hidden="true">
            ▾
          </span>
        </Dropdown.Trigger>
        <Dropdown.Menu className={styles.menu}>
          {COUNTRY_CODES.map((option) => (
            <Dropdown.Item
              key={option.iso}
              className={styles.option}
              onSelect={() => setCountryCode(option.iso)}
            >
              <span className={styles.optionName}>{option.name}</span>
              <span className={styles.optionDialCode}>{option.dialCode}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
      <Input ref={ref} {...rest} disabled={disabled} type="tel" className={styles.input} />
    </div>
  );
});

PhoneField.displayName = 'PhoneField';
