import { useMemo } from 'react';
import { Select } from '../Select/Select';
import type { SelectProps, SelectOption, SelectSize } from '../Select/Select';

export interface TimePickerOwnProps {
  /** Minutes between each option. Defaults to 30. */
  step?: number;
  /** Earliest time offered, as a 24-hour "HH:MM" string. Defaults to "00:00". */
  min?: string;
  /** Latest time offered, as a 24-hour "HH:MM" string. Defaults to "23:30" (i.e. the whole day at the default 30-minute step). */
  max?: string;
  /** Whether option labels read "2:30 PM" (default) or "14:30". `value`/`onChange` are always the 24-hour "HH:MM" string either way — this only changes what's displayed. */
  use12Hour?: boolean;
}

export type TimePickerProps = Omit<SelectProps, 'options'> & TimePickerOwnProps;

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

function formatLabel(minutesSinceMidnight: number, use12Hour: boolean): string {
  const hours24 = Math.floor(minutesSinceMidnight / 60) % 24;
  const minutes = minutesSinceMidnight % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  if (!use12Hour) return `${String(hours24).padStart(2, '0')}:${paddedMinutes}`;
  const period = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${paddedMinutes} ${period}`;
}

function buildOptions(step: number, min: string, max: string, use12Hour: boolean): SelectOption[] {
  const options: SelectOption[] = [];
  const start = toMinutes(min);
  const end = toMinutes(max);
  for (let minutes = start; minutes <= end; minutes += step) {
    const hours24 = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const value = `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    options.push({ value, label: formatLabel(minutes, use12Hour) });
  }
  return options;
}

/**
 * A thin wrapper generating a `Select` option list of times-of-day at a
 * fixed `step` (minutes) — not a separate implementation, since a time
 * picker over a closed set of increments *is* a `Select` once the option
 * list exists, the same reasoning that keeps `EmailField`/`NumberField`
 * thin wrappers on `Input`. `value`/`onChange`/`defaultValue` are always
 * the unambiguous 24-hour "HH:MM" string — `use12Hour` only changes the
 * displayed label ("2:30 PM" vs "14:30"), never the stored value, so a
 * consumer never has to branch on which format they're getting back.
 */
export function TimePicker({
  step = 30,
  min = '00:00',
  max = '23:30',
  use12Hour = true,
  ...rest
}: TimePickerProps) {
  const options = useMemo(
    () => buildOptions(step, min, max, use12Hour),
    [step, min, max, use12Hour],
  );

  return <Select {...rest} options={options} />;
}

TimePicker.displayName = 'TimePicker';

export type { SelectSize };
