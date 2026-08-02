import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  formatFullDate,
  formatMonth,
  formatMonthYear,
  isMonthOutOfRange,
  isOutOfRange,
  isSameDay,
  isYearOutOfRange,
  startOfDay,
  startOfYearPage,
  toDateKey,
  WEEKDAY_LABELS,
  YEAR_PAGE_SIZE,
} from './dateGrid';

describe('dateGrid', () => {
  it('startOfDay truncates to local midnight', () => {
    const result = startOfDay(new Date(2026, 7, 15, 13, 45, 30));
    expect(result).toEqual(new Date(2026, 7, 15, 0, 0, 0, 0));
  });

  it('addDays shifts by the given amount, including across month boundaries', () => {
    expect(addDays(new Date(2026, 7, 30), 3)).toEqual(new Date(2026, 8, 2));
    expect(addDays(new Date(2026, 7, 2), -3)).toEqual(new Date(2026, 6, 30));
  });

  it("addMonths clamps to the target month's last valid day", () => {
    expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    expect(addMonths(new Date(2028, 0, 31), 1)).toEqual(new Date(2028, 1, 29)); // 2028 is a leap year
  });

  it('addYears preserves month/day when not Feb 29', () => {
    expect(addYears(new Date(2026, 7, 15), 1)).toEqual(new Date(2027, 7, 15));
  });

  it('addYears clamps Feb 29 in a non-leap target year', () => {
    expect(addYears(new Date(2028, 1, 29), 1)).toEqual(new Date(2029, 1, 28));
  });

  it('isSameDay ignores time-of-day', () => {
    expect(isSameDay(new Date(2026, 7, 15, 1), new Date(2026, 7, 15, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 7, 15), new Date(2026, 7, 16))).toBe(false);
  });

  it('isOutOfRange checks both bounds, ignoring time-of-day', () => {
    const min = new Date(2026, 7, 10);
    const max = new Date(2026, 7, 20);
    expect(isOutOfRange(new Date(2026, 7, 9), min, max)).toBe(true);
    expect(isOutOfRange(new Date(2026, 7, 21), min, max)).toBe(true);
    expect(isOutOfRange(new Date(2026, 7, 15), min, max)).toBe(false);
    expect(isOutOfRange(new Date(2026, 7, 10), min, max)).toBe(false);
    expect(isOutOfRange(new Date(2026, 7, 20), min, max)).toBe(false);
    expect(isOutOfRange(new Date(2026, 7, 1), undefined, undefined)).toBe(false);
  });

  it('buildMonthGrid always returns a fixed 42-day, Sunday-first grid', () => {
    const grid = buildMonthGrid(new Date(2026, 7, 15));
    expect(grid).toHaveLength(42);
    expect(grid[0]).toEqual(new Date(2026, 6, 26)); // Aug 1, 2026 is a Saturday
    expect(grid[0]?.getDay()).toBe(0);
    expect(grid[41]).toEqual(new Date(2026, 8, 5));
  });

  it('toDateKey formats using local date parts, not toISOString', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 10, 30))).toBe('2026-11-30');
  });

  it('WEEKDAY_LABELS has 7 entries starting from Sunday', () => {
    expect(WEEKDAY_LABELS).toHaveLength(7);
    expect(new Set(WEEKDAY_LABELS).size).toBe(7);
  });

  it('formatMonthYear and formatFullDate produce non-empty locale strings', () => {
    expect(formatMonthYear(new Date(2026, 7, 15))).toContain('2026');
    expect(formatFullDate(new Date(2026, 7, 15))).toContain('2026');
  });

  it('formatMonth produces the month name only', () => {
    expect(formatMonth(new Date(2026, 7, 15))).toBe('August');
  });

  it('startOfYearPage floors to the YEAR_PAGE_SIZE-year page boundary', () => {
    expect(YEAR_PAGE_SIZE).toBe(12);
    expect(startOfYearPage(2026)).toBe(2016);
    expect(startOfYearPage(2016)).toBe(2016);
    expect(startOfYearPage(2027)).toBe(2016);
  });

  it('isMonthOutOfRange is true only when every day in the month is outside [min, max]', () => {
    const min = new Date(2026, 7, 10); // Aug 10, 2026
    const max = new Date(2026, 7, 20); // Aug 20, 2026
    expect(isMonthOutOfRange(2026, 7, min, max)).toBe(false); // August has valid days
    expect(isMonthOutOfRange(2026, 6, min, max)).toBe(true); // all of July is before min
    expect(isMonthOutOfRange(2026, 8, min, max)).toBe(true); // all of September is after max
    expect(isMonthOutOfRange(2026, 7, undefined, undefined)).toBe(false);
  });

  it('isYearOutOfRange is true only when every day in the year is outside [min, max]', () => {
    const min = new Date(2026, 7, 10);
    const max = new Date(2027, 1, 1);
    expect(isYearOutOfRange(2026, min, max)).toBe(false); // 2026 has valid days after Aug 10
    expect(isYearOutOfRange(2025, min, max)).toBe(true); // all of 2025 is before min
    expect(isYearOutOfRange(2028, min, max)).toBe(true); // all of 2028 is after max
    expect(isYearOutOfRange(2026, undefined, undefined)).toBe(false);
  });
});
