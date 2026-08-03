import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { Portal } from '../Portal/Portal';
import { useControllableState } from '../../hooks/useControllableState';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePositioning } from '../../hooks/usePositioning';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFieldContext } from '../../hooks/useFieldContext';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AITriggerButton } from '../AITriggerButton/AITriggerButton';
import { Button } from '../Button/Button';
import { mergeClasses } from '../../utilities/mergeClasses';
import inputStyles from '../Input/Input.module.css';
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
} from '../../utilities/dateGrid';
import styles from './DatePicker.module.css';

function defaultFormatDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/** The panel's current drill-down level: pick a day, a month (then day), or a year (then month). */
type DatePickerView = 'day' | 'month' | 'year';

export type DatePickerSelectionMode = 'single' | 'range';

export interface DateRange {
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
  selectionMode: DatePickerSelectionMode,
  selected: Date | undefined,
  range: DateRange | undefined,
): DaySelectionState {
  if (selectionMode === 'range') {
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
  return {
    isSelected: selected ? isSameDay(date, selected) : false,
    isRangeStart: false,
    isRangeEnd: false,
    isInRange: false,
  };
}

export interface DatePickerProps {
  /** `'single'` (default) selects one `Date`. `'range'` selects a `{start, end}` span — use `rangeValue`/`defaultRangeValue`/`onRangeChange` instead of `value`/`defaultValue`/`onChange` in that mode. */
  selectionMode?: DatePickerSelectionMode;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  /** Only used when `selectionMode="range"`. `end` is `undefined` while only the start of the range has been picked. */
  rangeValue?: DateRange;
  defaultRangeValue?: DateRange;
  onRangeChange?: (range: DateRange | undefined) => void;
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
  /** Formats a single date for the trigger's label (and each endpoint of a range). Defaults to a locale long date. */
  formatDate?: (date: Date) => string;
  className?: string;
  /**
   * Adds a natural-language date entry field ("next Friday", "in two
   * weeks") above the calendar grid. Off by default, and a no-op even
   * when `true` unless an ancestor `AIProvider` is mounted — the rendered
   * output is byte-identical to today's whenever this doesn't apply.
   * Only applies in `selectionMode="single"` — a deliberate scope cut,
   * the same kind `Select`'s "no typeahead" already accepted. The AI is
   * asked to respond with a single `YYYY-MM-DD` date; a response that
   * doesn't parse as a valid date is silently ignored, not applied. Does
   * NOT reuse `AISuggestionPopover` — this panel is already `Popover`-like
   * chrome, and nesting a second popover inside it would violate
   * CLAUDE.md's "no nested overlay boxes" rule, so the accept/reject UI
   * is hand-rolled directly into this panel instead.
   */
  aiParse?: boolean;
  /** Builds the prompt sent to the AI client from the typed text. Defaults to a "parse this into YYYY-MM-DD" instruction anchored to today's date. */
  buildAIPrompt?: (query: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Parse with AI'`. */
  aiParseLabel?: string;
}

function defaultBuildAIParsePrompt(query: string): string {
  const todayIso = new Date().toISOString().slice(0, 10);
  return `Today's date is ${todayIso}. Parse the following into a single date. Respond with only the date in YYYY-MM-DD format, nothing else. Text: "${query}"`;
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
 * Tab within the panel and restore focus to the trigger on close — the same
 * mechanism Dialog uses. `useFieldContext` wires the trigger up like `Input`
 * does.
 *
 * The panel drills down through three views — day grid (default), month
 * grid, year grid — so jumping to a distant date doesn't mean clicking
 * "previous month" dozens of times: clicking the heading (or Enter on it)
 * goes up a level (day -> month -> year), clicking a month or year cell
 * goes back down (year -> month -> day), each anchoring `focusedDate` to
 * the chosen month/year along the way. All three grids use `role="gridcell"`
 * on plain `<div>`s (not `<button>`s) with a roving `tabIndex` (0 on the
 * focused cell, -1 on the rest): a real `<button>` would match
 * `useFocusTrap`'s focusable-element selector for every cell regardless of
 * `tabIndex`, breaking the roving-tabindex pattern each grid depends on for
 * arrow-key navigation.
 *
 * `selectionMode="range"` reuses the same day grid: the first click sets
 * `range.start` (panel stays open to pick the end), the next click sets
 * `range.end` (swapping the two if it lands before `start`) and closes the
 * panel — clicking again after a range is complete starts a new one. There
 * is no live hover/focus preview of the in-progress range (only the
 * committed `start`/`end` are highlighted) — a deliberate scope cut, same
 * spirit as skipping free-text parsing.
 *
 * No `required` prop: unlike `Input`'s native `required` attribute, neither
 * `required` nor `aria-required` is valid on an element with the `button`
 * role, and this trigger has no text content to mark up either way — an
 * ancestor `Field`'s `required` still renders its label asterisk
 * independently of this component.
 */
export function DatePicker({
  selectionMode = 'single',
  value,
  defaultValue,
  onChange,
  rangeValue,
  defaultRangeValue,
  onRangeChange,
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
  aiParse = false,
  buildAIPrompt = defaultBuildAIParsePrompt,
  aiParseLabel = 'Parse with AI',
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
  const [range, setRange] = useControllableState<DateRange | undefined>({
    value: rangeValue,
    defaultValue: defaultRangeValue,
    onChange: onRangeChange,
  });
  const [isOpen, setIsOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });

  const today = startOfDay(new Date());
  const [focusedDate, setFocusedDate] = useState<Date>(
    () => (selectionMode === 'range' ? range?.start : selected) ?? today,
  );
  const [view, setView] = useState<DatePickerView>('day');

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
  }, [focusedDate, isOpen, view]);

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAIParse = aiParse && selectionMode === 'single' && !!aiClient;
  const [aiQueryText, setAiQueryText] = useState('');
  const aiParsedDate =
    aiAction.status === 'done' && !Number.isNaN(new Date(aiAction.result).getTime())
      ? startOfDay(new Date(aiAction.result))
      : undefined;

  useEffect(() => {
    if (!isOpen) {
      setAiQueryText('');
      aiAction.reset();
    }
    // Only reset when the panel closes — not a dependency on `aiAction`
    // itself, which is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function handleAIParse() {
    if (!aiQueryText.trim()) return;
    aiAction.trigger({ prompt: buildAIPrompt(aiQueryText) });
  }

  function acceptAIParsedDate() {
    if (aiParsedDate) selectDate(aiParsedDate);
    aiAction.reset();
    setAiQueryText('');
  }

  function toggleOpen() {
    if (!isOpen) {
      // Re-anchor the grid to the current selection (or today) each time it
      // opens, synchronously with the click that opens it, so useFocusTrap's
      // initial-focus effect (which fires in the same commit) targets the
      // right cell instead of a stale one left over from a prior session.
      setFocusedDate((selectionMode === 'range' ? range?.start : selected) ?? today);
      setView('day');
    }
    setIsOpen(!isOpen);
  }

  function selectDate(date: Date) {
    if (isOutOfRange(date, min, max)) return;

    if (selectionMode === 'single') {
      setSelected(date);
      setIsOpen(false);
      return;
    }

    if (!range?.start || range.end) {
      // Nothing picked yet, or the previous range was already complete - start a new one.
      setRange({ start: date, end: undefined });
      return;
    }
    // range.start is set and range.end isn't: this click sets the end (swapping if it lands before start).
    setRange(
      date < range.start ? { start: date, end: range.start } : { start: range.start, end: date },
    );
    setIsOpen(false);
  }

  function activateMonth(monthDate: Date) {
    if (isMonthOutOfRange(monthDate.getFullYear(), monthDate.getMonth(), min, max)) return;
    setFocusedDate(monthDate);
    setView('day');
  }

  function activateYear(year: number) {
    if (isYearOutOfRange(year, min, max)) return;
    const next = new Date(focusedDate);
    next.setFullYear(year);
    setFocusedDate(next);
    setView('month');
  }

  function drillUp() {
    if (view === 'day') setView('month');
    else if (view === 'month') setView('year');
  }

  function navigatePrev() {
    if (view === 'day') setFocusedDate(addMonths(focusedDate, -1));
    else if (view === 'month') setFocusedDate(addYears(focusedDate, -1));
    else setFocusedDate(addYears(focusedDate, -YEAR_PAGE_SIZE));
  }

  function navigateNext() {
    if (view === 'day') setFocusedDate(addMonths(focusedDate, 1));
    else if (view === 'month') setFocusedDate(addYears(focusedDate, 1));
    else setFocusedDate(addYears(focusedDate, YEAR_PAGE_SIZE));
  }

  function handleDayGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
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

  function handleMonthGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, -1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, 4));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, -4));
        break;
      case 'Home':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, -focusedDate.getMonth()));
        break;
      case 'End':
        event.preventDefault();
        setFocusedDate(addMonths(focusedDate, 11 - focusedDate.getMonth()));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        activateMonth(focusedDate);
        break;
      default:
        break;
    }
  }

  function handleYearGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const offsetInPage = focusedDate.getFullYear() - startOfYearPage(focusedDate.getFullYear());
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, 1));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, -1));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, 4));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, -4));
        break;
      case 'Home':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, -offsetInPage));
        break;
      case 'End':
        event.preventDefault();
        setFocusedDate(addYears(focusedDate, YEAR_PAGE_SIZE - 1 - offsetInPage));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        activateYear(focusedDate.getFullYear());
        break;
      default:
        break;
    }
  }

  function handleGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (view === 'day') handleDayGridKeyDown(event);
    else if (view === 'month') handleMonthGridKeyDown(event);
    else handleYearGridKeyDown(event);
  }

  function getTriggerLabel(): string {
    if (selectionMode === 'range') {
      if (!range?.start) return placeholder;
      if (!range.end) return formatDate(range.start);
      return `${formatDate(range.start)} – ${formatDate(range.end)}`;
    }
    return selected ? formatDate(selected) : placeholder;
  }

  const dayGrid = view === 'day' ? buildMonthGrid(focusedDate) : [];
  const dayWeeks = Array.from({ length: dayGrid.length / 7 }, (_, week) =>
    dayGrid.slice(week * 7, week * 7 + 7),
  );

  const monthRows =
    view === 'month'
      ? Array.from({ length: 3 }, (_, row) =>
          Array.from(
            { length: 4 },
            (_, col) => new Date(focusedDate.getFullYear(), row * 4 + col, 1),
          ),
        )
      : [];

  const yearPageStart = startOfYearPage(focusedDate.getFullYear());
  const yearRows =
    view === 'year'
      ? Array.from({ length: 3 }, (_, row) =>
          Array.from({ length: 4 }, (_, col) => yearPageStart + row * 4 + col),
        )
      : [];

  const headingText =
    view === 'day'
      ? formatMonthYear(focusedDate)
      : view === 'month'
        ? String(focusedDate.getFullYear())
        : `${yearPageStart}–${yearPageStart + YEAR_PAGE_SIZE - 1}`;

  const prevLabel =
    view === 'day' ? 'Previous month' : view === 'month' ? 'Previous year' : 'Previous years';
  const nextLabel = view === 'day' ? 'Next month' : view === 'month' ? 'Next year' : 'Next years';

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
        {getTriggerLabel()}
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
            {showAIParse && (
              <div className={styles.aiParseRow}>
                <div className={styles.aiParseInputRow}>
                  <input
                    type="text"
                    aria-label="Describe a date in words"
                    placeholder="e.g. next Friday"
                    value={aiQueryText}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                      setAiQueryText(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAIParse();
                      }
                    }}
                    className={mergeClasses(inputStyles.input, styles.aiParseInput)}
                  />
                  <AITriggerButton
                    aria-label={aiParseLabel}
                    status={aiAction.status}
                    onClick={handleAIParse}
                  />
                </div>
                {aiAction.status === 'error' && (
                  <div role="alert" className={styles.aiParseError}>
                    Couldn&apos;t parse that.
                  </div>
                )}
                {aiAction.status === 'done' && (
                  <div className={styles.aiParseResult}>
                    {aiParsedDate ? (
                      <>
                        <span>Did you mean {formatDate(aiParsedDate)}?</span>
                        <div className={styles.aiParseActions}>
                          <Button variant="ghost" size="sm" onClick={() => aiAction.reset()}>
                            Discard
                          </Button>
                          <Button variant="primary" size="sm" onClick={acceptAIParsedDate}>
                            Accept
                          </Button>
                        </div>
                      </>
                    ) : (
                      <span role="alert">Couldn&apos;t parse that as a date.</span>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className={styles.header}>
              <button
                type="button"
                aria-label={prevLabel}
                className={styles.navButton}
                onClick={navigatePrev}
              >
                ‹
              </button>
              {view === 'year' ? (
                <span id={headingId} className={styles.heading}>
                  {headingText}
                </span>
              ) : (
                <button
                  type="button"
                  id={headingId}
                  className={mergeClasses(styles.heading, styles.headingButton)}
                  aria-label={`${headingText}, choose ${view === 'day' ? 'month' : 'year'}`}
                  onClick={drillUp}
                >
                  {headingText}
                </button>
              )}
              <button
                type="button"
                aria-label={nextLabel}
                className={styles.navButton}
                onClick={navigateNext}
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
              {view === 'day' && (
                <div role="row" className={styles.weekRow}>
                  {WEEKDAY_LABELS.map((label) => (
                    <span key={label} role="columnheader" className={styles.weekday}>
                      {label}
                    </span>
                  ))}
                </div>
              )}
              {view === 'day' &&
                dayWeeks.map((week, weekIndex) => (
                  <div role="row" className={styles.weekRow} key={weekIndex}>
                    {week.map((date) => {
                      const isFocused = isSameDay(date, focusedDate);
                      const isToday = isSameDay(date, today);
                      const isOutsideMonth = date.getMonth() !== focusedDate.getMonth();
                      const isDisabled = isOutOfRange(date, min, max);
                      const { isSelected, isRangeStart, isRangeEnd, isInRange } =
                        getDaySelectionState(date, selectionMode, selected, range);

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
                          data-range-start={isRangeStart || undefined}
                          data-range-end={isRangeEnd || undefined}
                          data-in-range={isInRange || undefined}
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
              {view === 'month' &&
                monthRows.map((row, rowIndex) => (
                  <div role="row" className={styles.optionRow} key={rowIndex}>
                    {row.map((monthDate) => {
                      const isFocused =
                        monthDate.getMonth() === focusedDate.getMonth() &&
                        monthDate.getFullYear() === focusedDate.getFullYear();
                      const isCurrent =
                        monthDate.getMonth() === today.getMonth() &&
                        monthDate.getFullYear() === today.getFullYear();
                      const isDisabled = isMonthOutOfRange(
                        monthDate.getFullYear(),
                        monthDate.getMonth(),
                        min,
                        max,
                      );

                      return (
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- see the day grid's identical comment above
                        <div
                          key={monthDate.getMonth()}
                          ref={isFocused ? focusedCellRef : undefined}
                          role="gridcell"
                          tabIndex={isFocused ? 0 : -1}
                          aria-current={isCurrent ? 'date' : undefined}
                          aria-disabled={isDisabled || undefined}
                          aria-label={`${formatMonth(monthDate)} ${monthDate.getFullYear()}`}
                          data-today={isCurrent || undefined}
                          data-disabled={isDisabled || undefined}
                          className={styles.optionCell}
                          onClick={() => activateMonth(monthDate)}
                        >
                          {formatMonth(monthDate)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              {view === 'year' &&
                yearRows.map((row, rowIndex) => (
                  <div role="row" className={styles.optionRow} key={rowIndex}>
                    {row.map((year) => {
                      const isFocused = year === focusedDate.getFullYear();
                      const isCurrent = year === today.getFullYear();
                      const isDisabled = isYearOutOfRange(year, min, max);

                      return (
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- see the day grid's identical comment above
                        <div
                          key={year}
                          ref={isFocused ? focusedCellRef : undefined}
                          role="gridcell"
                          tabIndex={isFocused ? 0 : -1}
                          aria-current={isCurrent ? 'date' : undefined}
                          aria-disabled={isDisabled || undefined}
                          aria-label={String(year)}
                          data-today={isCurrent || undefined}
                          data-disabled={isDisabled || undefined}
                          className={styles.optionCell}
                          onClick={() => activateYear(year)}
                        >
                          {year}
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
