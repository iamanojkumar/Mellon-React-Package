import { forwardRef } from 'react';
import type { ChangeEvent } from 'react';
import { Input } from '../Input/Input';
import type { InputProps } from '../Input/Input';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './SearchField.module.css';

export interface SearchFieldOwnProps {
  /** Accessible label for the clear button. Defaults to "Clear search". */
  clearLabel?: string;
}

export type SearchFieldProps = Omit<InputProps, 'type'> & SearchFieldOwnProps;

/**
 * `Input` with `type="search"` plus a clear button, shown once there's a
 * value. Unlike `EmailField`/`PhoneField`/`NumberField` (pure passthrough),
 * this one needs to know the current value to decide whether to render the
 * clear button and to reset it on click — so it owns `useControllableState`
 * itself and always renders `Input` in controlled mode (passing a defined
 * `value`/`onChange` down), the same shape `Input.stories.tsx`'s
 * `Controlled` story already demonstrates. The browser's own native
 * `type="search"` clear affordance (`::-webkit-search-cancel-button`) is
 * suppressed via CSS so it doesn't visually double up with this one.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, clearLabel = 'Clear search', value: valueProp, defaultValue, onChange, ...rest },
  ref,
) {
  const [value, setValue] = useControllableState<string>({
    value: valueProp,
    defaultValue,
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  function handleClear() {
    setValue('');
  }

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <Input
        ref={ref}
        {...rest}
        type="search"
        value={value ?? ''}
        onChange={handleChange}
        className={mergeClasses(styles.input, value && styles.hasClear)}
      />
      {!!value && (
        <button
          type="button"
          className={styles.clear}
          aria-label={clearLabel}
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  );
});

SearchField.displayName = 'SearchField';
