import { OTPInput } from '../OTPInput/OTPInput';
import type { OTPInputProps } from '../OTPInput/OTPInput';

export type {
  OTPInputCharacterType as PinInputCharacterType,
  OTPInputSize as PinInputSize,
} from '../OTPInput/OTPInput';

export type PinInputProps = Omit<OTPInputProps, 'mask'>;

/**
 * A thin wrapper fixing `OTPInput`'s `mask` to `true` and defaulting
 * `length` to 4 (the common PIN length, still overridable) — the same
 * "generate a preset, don't reimplement" shape `TimePicker`-on-`Select`
 * and `Autocomplete`-on-`Combobox` already established. `length` is
 * placed *before* the prop spread so a consumer's own value still wins;
 * `mask` is placed *after* it so it can't be turned off — hiding entry is
 * the entire reason to reach for `PinInput` over `OTPInput` in the first
 * place.
 */
export function PinInput({ length = 4, ...props }: PinInputProps) {
  return <OTPInput length={length} {...props} mask />;
}

PinInput.displayName = 'PinInput';
