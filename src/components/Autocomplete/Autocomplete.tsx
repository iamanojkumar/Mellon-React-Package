import { Combobox } from '../Combobox/Combobox';
import type { ComboboxProps } from '../Combobox/Combobox';

export type { ComboboxOption } from '../Combobox/Combobox';

export type AutocompleteProps = Omit<ComboboxProps, 'allowFreeText'>;

/**
 * A thin wrapper on `Combobox` with `allowFreeText` fixed to `true` — the
 * same "generate a preset, don't reimplement" shape `TimePicker` already
 * used on `Select` in Phase 9. Whatever the user types becomes `value`
 * immediately (no "must pick from the list" constraint, no revert on
 * blur/Escape) — the option list is suggestions, not a closed set,
 * matching what "Autocomplete" means for something like a search or
 * address field versus `Combobox`'s "editable select."
 */
export function Autocomplete(props: AutocompleteProps) {
  return <Combobox {...props} allowFreeText />;
}

Autocomplete.displayName = 'Autocomplete';
