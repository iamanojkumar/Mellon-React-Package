import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePositioning } from '../../hooks/usePositioning';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './DatePicker.module.css';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Clamps to the target month's last valid day (Jan 31 + 1 month -> Feb 28/29, not Mar 3). */
function addMonths(date: Date, amount: number): Date {
  const day = date.getDate();
  const next = new Date(date.getFullYear(), date.getMonth(), 1);
  next.setMonth(next.getMonth() + amount);
  const lastDayOfTargetMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDayOfTargetMonth));
  return next;
}

function addYears(date: Date, amount: number): Date {
  return addMonths(date, amount * 12);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isOutOfRange(date: Date, min: Date | undefined, max: Date | undefined): boolean {
  const day = startOfDay(date).getTime();
  if (min && day < startOfDay(min).getTime()) return true;
  if (max && day > startOfDay(max).getTime()) return true;
  return false;
}

/** Always a 6-week (42-day) grid so month-to-month layout height never shifts. */
function buildMonthGrid(anchor: Date): Date[] {
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = addDays(firstOfMonth, -firstOfMonth.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** Local (not UTC, unlike `toISOString`) date key — stable across timezones for the `key`/`data-date` attribute. */
function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Jan 1, 2023 was a Sunday - an arbitrary Sun-Sat week used only to read
// locale weekday abbreviations in order, independent of the calendar's
// actual dates.
const WEEKDAY_LABELS = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(2023, 0, 1 + i)),
);

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function defaultFormatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export interface DatePickerProps {
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Dates before this are shown but not selectable. */
  min?: Date;
  /** Dates after this are shown but not selectable. */
  max?: Date;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  placeholder?: string;
  /** Formats the trigger's label for the selected date. Defaults to a locale long date. */
  formatDate?: (date: Date) => string;
  className?: string;
}

/**
 * Not polymorphic — a date picker is a fixed trigger-button + calendar-panel
 * structure, not a single leaf element. Deliberately a button trigger
 * showing a formatted date rather than a free-text input: locale-aware date
 * *parsing* is a separate, much larger scope than the calendar grid/date
 * math/keyboard nav this component focuses on (see docs/SPEC.md's Phase 3
 * notes on why DatePicker was deferred).
 *
 * Reuses Phase 3's overlay infra directly: `usePositioning` for the panel,
 * `useClickOutside`/`useEscapeKey` to dismiss, and `useFocusTrap` to contain
 * Tab within the panel (prev/next month buttons + the one roving-tabindex
 * day cell) and restore focus to the trigger on close — the same mechanism
 * Dialog uses. `useFieldContext` wires the trigger up like `Input` does.
 *
 * The day grid uses `role="gridcell"` on plain `<div>`s (not `<button>`s)
 * with a roving `tabIndex` (0 on the focused day, -1 on the rest): a real
 * `<button>` would match `useFocusTrap`'s focusable-element selector for
 * every day regardless of its `tabIndex`, breaking the roving-tabindex
 * pattern the grid depends on for arrow-key navigation.
 *
 * No `required` prop: unlike `Input`'s native `required` attribute, neither
 * `required` nor `aria-required` is valid on an element with the `button`
 * role, and this trigger has no text content to mark up either way — an
 * ancestor `Field`'s `required` still renders its label asterisk
 * independently of this component.
 */
export function DatePicker({
  value,
  defaultValue,
  onChange,
  open,
  defaultOpen = false,
  onOpenChange,
  min,
  max,
  disabled,
  invalid,
  id,
  placeholder = 'Select a date',
  formatDate = defaultFormatDate,
  className,
}: DatePickerProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;

  const [selected, setSelected] = useControllableState<Date | undefined>({
    value,
    defaultValue,
    onChange,
  });
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const today = startOfDay(new Date());
  const [focusedDate, setFocusedDate] = useState<Date>(() => selected ?? today);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const focusedCellRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const position = usePositioning(triggerRef, panelRef, {
    active: isOpen,
    placement: 'bottom-start',
  });

  useFocusTrap(panelRef, { active: isOpen, initialFocusRef: focusedCellRef });
  useEscapeKey(() => setIsOpen(false), isOpen);
  useClickOutside([panelRef, triggerRef], () => setIsOpen(false), isOpen);

  useEffect(() => {
    if (isOpen) focusedCellRef.current?.focus();
  }, [focusedDate, isOpen]);

  function toggleOpen() {
    if (!isOpen) {
      // Re-anchor the grid to the current selection (or today) each time it
      // opens, synchronously with the click that opens it, so useFocusTrap's
      // initial-focus effect (which fires in the same commit) targets the
      // right cell instead of a stale one left over from a prior session.
      setFocusedDate(selected ?? today);
    }
    setIsOpen(!isOpen);
  }

  function selectDate(date: Date) {
    if (isOutOfRange(date, min, max)) return;
    setSelected(date);
    setIsOpen(false);
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, -1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, 7));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, -7));
        break;
      case 'Home':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, -focusedDate.getDay()));
        break;
      case 'End':
        event.preventDefault();
        setFocusedDate(addDays(focusedDate, 6 - focusedDate.getDay()));
        break;
      case 'PageUp':
        event.preventDefault();
        setFocusedDate(event.shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1));
        break;
      case 'PageDown':
        event.preventDefault();
        setFocusedDate(event.shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1));
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

  const grid = buildMonthGrid(focusedDate);
  const weeks = Array.from({ length: 6 }, (_, week) => grid.slice(week * 7, week * 7 + 7));

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={resolvedId}
        className={mergeClasses(styles.trigger, className)}
        // aria-invalid isn't in the button role's supported-props list (unlike
        // Input's native <input>) - data-invalid still drives the invalid style.
        data-invalid={resolvedInvalid || undefined}
        aria-describedby={field?.describedById}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        disabled={resolvedDisabled}
        onClick={toggleOpen}
      >
        {selected ? formatDate(selected) : placeholder}
      </button>
      {isOpen && (
        <Portal>
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            className={styles.panel}
            style={{ position: 'absolute', left: position.x, top: position.y }}
          >
            <div className={styles.header}>
              <button
                type="button"
                aria-label="Previous month"
                className={styles.navButton}
                onClick={() => setFocusedDate(addMonths(focusedDate, -1))}
              >
                ‹
              </button>
              <span id={headingId} className={styles.heading}>
                {formatMonthYear(focusedDate)}
              </span>
              <button
                type="button"
                aria-label="Next month"
                className={styles.navButton}
                onClick={() => setFocusedDate(addMonths(focusedDate, 1))}
              >
                ›
              </button>
            </div>
            <div
              role="grid"
              tabIndex={-1}
              aria-labelledby={headingId}
              className={styles.grid}
              onKeyDown={handleGridKeyDown}
            >
              <div role="row" className={styles.weekRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <span key={label} role="columnheader" className={styles.weekday}>
                    {label}
                  </span>
                ))}
              </div>
              {weeks.map((week, weekIndex) => (
                <div role="row" className={styles.weekRow} key={weekIndex}>
                  {week.map((date) => {
                    const isFocused = isSameDay(date, focusedDate);
                    const isSelected = selected ? isSameDay(date, selected) : false;
                    const isToday = isSameDay(date, today);
                    const isOutsideMonth = date.getMonth() !== focusedDate.getMonth();
                    const isDisabled = isOutOfRange(date, min, max);

                    return (
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- Enter/Space are handled by the parent grid's onKeyDown, which sees them via bubbling from whichever cell holds the roving tabindex focus
                      <div
                        key={toDateKey(date)}
                        ref={isFocused ? focusedCellRef : undefined}
                        role="gridcell"
                        tabIndex={isFocused ? 0 : -1}
                        aria-selected={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        aria-disabled={isDisabled || undefined}
                        aria-label={formatFullDate(date)}
                        data-date={toDateKey(date)}
                        data-outside-month={isOutsideMonth || undefined}
                        data-today={isToday || undefined}
                        data-disabled={isDisabled || undefined}
                        className={styles.day}
                        onClick={() => {
                          setFocusedDate(date);
                          selectDate(date);
                        }}
                      >
                        {date.getDate()}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

DatePicker.displayName = 'DatePicker';
