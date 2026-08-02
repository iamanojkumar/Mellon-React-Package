/**
 * Pure date-math shared by every calendar-grid component (`DatePicker`,
 * later `Calendar`/`Date Range Picker` — see docs/SPEC.md's Phase 4 notes).
 * Extracted out of `DatePicker.tsx` so later consumers import from here
 * instead of forking it by copy-paste.
 */

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Clamps to the target month's last valid day (Jan 31 + 1 month -> Feb 28/29, not Mar 3). */
export function addMonths(date: Date, amount: number): Date {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setMonth(next.getMonth() + amount);
  const lastDayOfTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDayOfTargetMonth));
  return next;
}

export function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isOutOfRange(date: Date, min: Date | undefined, max: Date | undefined): boolean {
  const day = startOfDay(date).getTime();
  if (min && day < startOfDay(min).getTime()) return true;
  if (max && day > startOfDay(max).getTime()) return true;
  return false;
}

/** True only when *every* day in the month falls outside [min, max] — a month with some valid days stays selectable so its days remain reachable. */
export function isMonthOutOfRange(
  year: number,
  month: number,
  min: Date | undefined,
  max: Date | undefined,
): boolean {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  if (min && lastOfMonth.getTime() < startOfDay(min).getTime()) return true;
  if (max && firstOfMonth.getTime() > startOfDay(max).getTime()) return true;
  return false;
}

/** True only when *every* day in the year falls outside [min, max] — same reasoning as `isMonthOutOfRange`. */
export function isYearOutOfRange(
  year: number,
  min: Date | undefined,
  max: Date | undefined,
): boolean {
  const firstOfYear = new Date(year, 0, 1);
  const lastOfYear = new Date(year, 11, 31);
  if (min && lastOfYear.getTime() < startOfDay(min).getTime()) return true;
  if (max && firstOfYear.getTime() > startOfDay(max).getTime()) return true;
  return false;
}

/** Always a 6-week (42-day) grid so month-to-month layout height never shifts. */
export function buildMonthGrid(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Local (not UTC, unlike `toISOString`) date key — stable across timezones for `key`/`data-date` attributes. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Jan 1, 2023 was a Sunday - an arbitrary Sun-Sat week used only to read
// locale weekday abbreviations in order, independent of the calendar's
// actual dates.
export const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2023, 0, 1 + i)),
);

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

export function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date);
}

/** How many years a "year view" page shows at once (`DatePicker`'s year-grid drill-down). */
export const YEAR_PAGE_SIZE = 12;

/** Start of the `YEAR_PAGE_SIZE`-year page containing `year`, e.g. 2026 -> 2016 for a 12-year page. */
export function startOfYearPage(year: number): number {
  return year - (year % YEAR_PAGE_SIZE);
}

export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
