import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useControllableState } from '../../hooks/useControllableState';
import {
  addDays,
  addMonths,
  addYears,
  buildMonthGrid,
  formatFullDate,
  formatMonthYear,
  isOutOfRange,
  isSameDay,
  startOfDay,
  toDateKey,
  WEEKDAY_LABELS,
} from '../../utilities/dateGrid';
import datePickerStyles from '../DatePicker/DatePicker.module.css';
import styles from './Calendar.module.css';

export type CalendarSelectionMode = 'single' | 'multiple' | 'range' | 'none';
export type CalendarDayIndicatorColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface CalendarDateRange {
  start: Date;
  end?: Date;
}

interface DaySelectionState {
  isSelected: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
}

function getDaySelectionState(
  date: Date,
  mode: CalendarSelectionMode,
  selected: Date | undefined,
  selectedValues: Date[],
  range: CalendarDateRange | undefined,
): DaySelectionState {
  if (mode === 'range') {
    const isRangeStart = Boolean(range?.start && isSameDay(date, range.start));
    const isRangeEnd = Boolean(range?.end && isSameDay(date, range.end));
    const isInRange = Boolean(range?.start && range?.end && date > range.start && date < range.end);
    return {
      isSelected: isRangeStart || isRangeEnd || isInRange,
      isRangeStart,
      isRangeEnd,
      isInRange,
    };
  }
  if (mode === 'multiple') {
    return {
      isSelected: selectedValues.some((d) => isSameDay(d, date)),
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
    };
  }
  if (mode === 'single') {
    return {
      isSelected: selected ? isSameDay(date, selected) : false,
      isRangeStart: false,
      isRangeEnd: false,
      isInRange: false,
    };
  }
  return { isSelected: false, isRangeStart: false, isRangeEnd: false, isInRange: false };
}

export interface CalendarProps {
  /** `'single'` (default) selects one `Date`. `'multiple'` selects any number independently. `'range'` selects a `{start, end}` span. `'none'` renders a read-only, browsable grid — e.g. for `dayIndicator`-only event display. */
  selectionMode?: CalendarSelectionMode;
  /** Only used when `selectionMode="single"`. */
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  /** Only used when `selectionMode="multiple"`. */
  values?: Date[];
  defaultValues?: Date[];
  onValuesChange?: (values: Date[]) => void;
  /** Only used when `selectionMode="range"`. `end` is `undefined` while only the start of the range has been picked. */
  rangeValue?: CalendarDateRange;
  defaultRangeValue?: CalendarDateRange;
  onRangeChange?: (range: CalendarDateRange | undefined) => void;
  /** Dates before this are shown but not selectable. */
  min?: Date;
  /** Dates after this are shown but not selectable. */
  max?: Date;
  /** Returns a marker-dot color for a given day (e.g. days with events), or `undefined` for no marker. */
  dayIndicator?: (date: Date) => CalendarDayIndicatorColor | undefined;
  className?: string;
}

/**
 * Always-visible month grid — the "Data-Heavy Display" counterpart to
 * `DatePicker`'s popover-triggered picker (see docs/SPEC.md's Phase 15
 * notes). Reuses `dateGrid.ts`'s pure date math directly (its stated
 * purpose — see that file's own header comment) and, for CSS, imports
 * `DatePicker.module.css`'s self-contained `.header`/`.heading`/
 * `.navButton`/`.grid`/`.weekRow`/`.weekday`/`.day` rules rather than
 * duplicating them (see docs/SPEC.md's cross-component CSS reuse note).
 *
 * Deliberately does **not** reuse `DatePicker`'s JSX/keyboard-nav: that code
 * is entangled with `DatePicker`'s own trigger/popover/focus-trap plumbing
 * and its day -> month -> year view-drilling, none of which apply to an
 * always-open single-month grid with no distant-date-jump problem to solve.
 * The day-grid keyboard handler below is a deliberate, smaller duplicate
 * scoped to Calendar's simpler case (Arrow/Home/End/PageUp/PageDown/Enter,
 * no view state) — the explicit alternative docs/SPEC.md called out to
 * forking `DatePicker`'s view-drilling machinery for a feature Calendar
 * doesn't have.
 *
 * `selectionMode="none"` keeps the grid focusable/browsable via keyboard
 * (for `dayIndicator`-driven event calendars where browsing without picking
 * is the point) without ever marking a day `aria-selected`.
 */
export function Calendar({
  selectionMode = 'single',
  value,
  defaultValue,
  onChange,
  values,
  defaultValues,
  onValuesChange,
  rangeValue,
  defaultRangeValue,
  onRangeChange,
  min,
  max,
  dayIndicator,
  className,
}: CalendarProps) {
  const [selected, setSelected] = useControllableState<Date | undefined>({
    value,
    defaultValue,
    onChange,
  });
  const [selectedValues, setSelectedValues] = useControllableState<Date[]>({
    value: values,
    defaultValue: defaultValues ?? [],
    onChange: onValuesChange,
  });
  const [range, setRange] = useControllableState<CalendarDateRange | undefined>({
    value: rangeValue,
    defaultValue: defaultRangeValue,
    onChange: onRangeChange,
  });

  const today = startOfDay(new Date());
  const anchor =
    (selectionMode === 'range'
      ? range?.start
      : selectionMode === 'multiple'
        ? selectedValues[0]
        : selected) ?? today;
  const [focusedDate, setFocusedDate] = useState<Date>(anchor);

  const gridRef = useRef<HTMLDivElement>(null);
  const focusedCellRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  // Tracks whether the grid should keep DOM focus in sync with `focusedDate`.
  // Unlike DatePicker's identical-looking effect (gated on `isOpen`, so it
  // only ever fires right after a fresh open), Calendar is always mounted,
  // so the same "move focus to the focused cell" effect must not fire on
  // initial mount (that would steal page focus unprompted) — but it must
  // fire after any interaction that changes the month, e.g. a mouse click on
  // "Next month", since that click swaps out the entire keyed cell grid
  // (every date's `key` changes), which unmounts whatever cell the browser
  // had focused and silently resets focus to <body>, breaking keyboard nav
  // the moment it crosses a month boundary. Checking DOM containment after
  // the fact can't distinguish those two cases (both show focus outside the
  // grid), so interaction is tracked explicitly instead via `moveFocus`.
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (hasInteractedRef.current) {
      focusedCellRef.current?.focus();
    }
  }, [focusedDate]);

  function moveFocus(date: Date) {
    hasInteractedRef.current = true;
    setFocusedDate(date);
  }

  function selectDate(date: Date) {
    if (isOutOfRange(date, min, max)) return;

    if (selectionMode === 'none') return;

    if (selectionMode === 'single') {
      setSelected(date);
      return;
    }

    if (selectionMode === 'multiple') {
      const exists = selectedValues.some((d) => isSameDay(d, date));
      setSelectedValues(
        exists ? selectedValues.filter((d) => !isSameDay(d, date)) : [...selectedValues, date],
      );
      return;
    }

    // range
    if (!range?.start || range.end) {
      setRange({ start: date, end: undefined });
      return;
    }
    setRange(
      date < range.start ? { start: date, end: range.start } : { start: range.start, end: date },
    );
  }

  function navigatePrev() {
    moveFocus(addMonths(focusedDate, -1));
  }

  function navigateNext() {
    moveFocus(addMonths(focusedDate, 1));
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 7));
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -7));
        break;
      case 'Home':
        event.preventDefault();
        moveFocus(addDays(focusedDate, -focusedDate.getDay()));
        break;
      case 'End':
        event.preventDefault();
        moveFocus(addDays(focusedDate, 6 - focusedDate.getDay()));
        break;
      case 'PageUp':
        event.preventDefault();
        moveFocus(event.shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1));
        break;
      case 'PageDown':
        event.preventDefault();
        moveFocus(event.shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        selectDate(focusedDate);
        break;
      default:
        break;
    }
  }

  const dayGrid = buildMonthGrid(focusedDate);
  const weeks = Array.from({ length: dayGrid.length / 7 }, (_, week) =>
    dayGrid.slice(week * 7, week * 7 + 7),
  );

  return (
    <div className={mergeClasses(styles.calendar, className)}>
      <div className={datePickerStyles.header}>
        <button
          type="button"
          aria-label="Previous month"
          className={datePickerStyles.navButton}
          onClick={navigatePrev}
        >
          ‹
        </button>
        <span id={headingId} className={datePickerStyles.heading}>
          {formatMonthYear(focusedDate)}
        </span>
        <button
          type="button"
          aria-label="Next month"
          className={datePickerStyles.navButton}
          onClick={navigateNext}
        >
          ›
        </button>
      </div>
      <div
        ref={gridRef}
        role="grid"
        tabIndex={-1}
        aria-labelledby={headingId}
        aria-readonly={selectionMode === 'none' || undefined}
        className={datePickerStyles.grid}
        onKeyDown={handleGridKeyDown}
      >
        <div role="row" className={datePickerStyles.weekRow}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} role="columnheader" className={datePickerStyles.weekday}>
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div role="row" className={datePickerStyles.weekRow} key={weekIndex}>
            {week.map((date) => {
              const isFocused = isSameDay(date, focusedDate);
              const isToday = isSameDay(date, today);
              const isOutsideMonth = date.getMonth() !== focusedDate.getMonth();
              const isDisabled = isOutOfRange(date, min, max);
              const { isSelected, isRangeStart, isRangeEnd, isInRange } = getDaySelectionState(
                date,
                selectionMode,
                selected,
                selectedValues,
                range,
              );
              const indicatorColor = dayIndicator?.(date);

              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter/Space are handled by the parent grid's onKeyDown, which sees them via bubbling from whichever cell holds the roving tabindex focus
                <div
                  key={toDateKey(date)}
                  ref={isFocused ? focusedCellRef : undefined}
                  role="gridcell"
                  tabIndex={isFocused ? 0 : -1}
                  aria-selected={selectionMode === 'none' ? undefined : isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-disabled={isDisabled || undefined}
                  aria-label={formatFullDate(date)}
                  data-date={toDateKey(date)}
                  data-outside-month={isOutsideMonth || undefined}
                  data-today={isToday || undefined}
                  data-disabled={isDisabled || undefined}
                  data-range-start={isRangeStart || undefined}
                  data-range-end={isRangeEnd || undefined}
                  data-in-range={isInRange || undefined}
                  className={mergeClasses(datePickerStyles.day, styles.dayCell)}
                  onClick={() => {
                    moveFocus(date);
                    selectDate(date);
                  }}
                >
                  <span>{date.getDate()}</span>
                  {indicatorColor && (
                    <span
                      className={styles.indicator}
                      data-color={indicatorColor}
                      aria-hidden="true"
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

Calendar.displayName = 'Calendar';
