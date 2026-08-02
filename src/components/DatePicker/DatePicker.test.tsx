import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { DatePicker } from './DatePicker';

// Aug 15, 2026 is a Saturday - fixed via `defaultValue`/`initialValue` (not
// the system clock, which `usePositioning`'s `autoUpdate` loop depends on)
// so grid position is deterministic without faking timers.
const ANCHOR = new Date(2026, 7, 15);

function ControlledDatePicker(props: {
  initialValue?: Date;
  onChange?: (date: Date | undefined) => void;
}) {
  const [value, setValue] = useState<Date | undefined>(props.initialValue);
  return (
    <DatePicker
      value={value}
      onChange={(date) => {
        setValue(date);
        props.onChange?.(date);
      }}
    />
  );
}

describe('DatePicker', () => {
  it('renders a closed trigger with placeholder text by default', () => {
    render(<DatePicker placeholder="Pick a date" />);
    expect(screen.getByRole('button', { name: 'Pick a date' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the formatted value on the trigger when a date is selected', () => {
    render(<DatePicker value={new Date(2026, 0, 5)} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'January 5, 2026' })).toBeInTheDocument();
  });

  it('opens the calendar on trigger click, focused on today by default', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { current: 'date' })).toHaveFocus();
  });

  it('opens focused on the selected date when one is set', async () => {
    const user = userEvent.setup();
    render(<DatePicker value={ANCHOR} onChange={() => {}} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    await user.click(screen.getByRole('button'));
    await expectNoA11yViolations(document.body);
  });

  it('selects a date on click, closes the panel, and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDatePicker initialValue={ANCHOR} onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ }));
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 17));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('restores focus to the trigger after selecting a date', async () => {
    const user = userEvent.setup();
    render(<ControlledDatePicker initialValue={ANCHOR} />);
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }));
    expect(trigger).toHaveFocus();
  });

  it('navigates days with arrow keys and selects the focused day with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledDatePicker initialValue={ANCHOR} onChange={onChange} />);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    // from Aug 15 (Sat): +1 -> 16 (Sun), +1 -> 17 (Mon), +7 -> 24 (Mon)
    expect(screen.getByRole('gridcell', { name: /^Monday, August 24, 2026/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 24));
  });

  it('jumps to the start/end of the week with Home/End', async () => {
    const user = userEvent.setup();
    render(<ControlledDatePicker initialValue={ANCHOR} />);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Home}');
    expect(screen.getByRole('gridcell', { name: /^Sunday, August 9, 2026/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveFocus();
  });

  it('navigates months with the header buttons and with PageUp/Shift+PageDown', async () => {
    const user = userEvent.setup();
    render(<ControlledDatePicker initialValue={ANCHOR} />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('August 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('August 2026')).toBeInTheDocument();

    await user.keyboard('{PageDown}');
    expect(screen.getByText('September 2026')).toBeInTheDocument();

    await user.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(screen.getByText('September 2027')).toBeInTheDocument();
  });

  it('marks dates outside min/max as disabled and does not select them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        value={ANCHOR}
        min={new Date(2026, 7, 10)}
        max={new Date(2026, 7, 20)}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button'));

    const outOfRangeCell = screen.getByRole('gridcell', { name: /^Sunday, August 2, 2026/ });
    expect(outOfRangeCell).toHaveAttribute('aria-disabled', 'true');

    await user.click(outOfRangeCell);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<DatePicker />);
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DatePicker />
        <button type="button">elsewhere</button>
      </div>,
    );
    await user.click(screen.getByRole('button', { name: 'Select a date' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<DatePicker disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  describe('month/year drill-down navigation', () => {
    it('clicking the heading switches from the day grid to a 12-month grid for the focused year', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /August 2026, choose month/ }));

      expect(screen.getByText('2026')).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: 'August 2026' })).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: 'January 2026' })).toBeInTheDocument();
      expect(screen.queryByRole('gridcell', { name: /^Saturday, August/ })).not.toBeInTheDocument();
    });

    it('clicking a month drills back into the day grid anchored on that month', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('gridcell', { name: 'March 2026' }));

      expect(screen.getByText('March 2026')).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: /^Sunday, March 1, 2026/ })).toBeInTheDocument();
    });

    it('clicking the heading again from month view switches to a 12-year grid', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('button', { name: /2026, choose year/ }));

      // Aug 15, 2026 falls in the 2016-2027 twelve-year page
      expect(screen.getByText('2016–2027')).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: '2026' })).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: '2016' })).toBeInTheDocument();
    });

    it('clicking a year drills back into the month grid for that year', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('button', { name: /choose year/ }));
      await user.click(screen.getByRole('gridcell', { name: '2020' }));

      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: 'August 2020' })).toBeInTheDocument();
    });

    it('has no top-level drill-up control in year view (nothing above years)', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('button', { name: /choose year/ }));

      expect(screen.queryByRole('button', { name: /choose/ })).not.toBeInTheDocument();
      expect(screen.getByText('2016–2027')).toBeInTheDocument();
    });

    it('navigates month view by year and year view by 12-year pages with the header buttons', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      expect(screen.getByText('2026')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next year' }));
      expect(screen.getByText('2027')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      expect(screen.getByText('2016–2027')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Next years' }));
      expect(screen.getByText('2028–2039')).toBeInTheDocument();
    });

    it('navigates the month grid with arrow keys and Home/End, and drills down with Enter', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      // focus starts on August (index 7); ArrowRight -> September, ArrowDown -> +4 -> January (wraps within Enter target, no page change since Sept(8)+4=12 overflows within same year handled by addMonths crossing into next year)
      await user.keyboard('{Home}');
      expect(screen.getByRole('gridcell', { name: 'January 2026' })).toHaveFocus();
      await user.keyboard('{End}');
      expect(screen.getByRole('gridcell', { name: 'December 2026' })).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(screen.getByRole('gridcell', { name: 'November 2026' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByText('November 2026')).toBeInTheDocument();
    });

    it('navigates the year grid with arrow keys and Home/End, and drills down with Enter', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('button', { name: /choose year/ }));
      await user.keyboard('{Home}');
      expect(screen.getByRole('gridcell', { name: '2016' })).toHaveFocus();
      await user.keyboard('{End}');
      expect(screen.getByRole('gridcell', { name: '2027' })).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByRole('gridcell', { name: '2023' })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(screen.getByText('2023')).toBeInTheDocument();
    });

    it('re-opening resets the panel to day view', async () => {
      const user = userEvent.setup();
      render(<ControlledDatePicker initialValue={ANCHOR} />);
      const trigger = screen.getByRole('button');
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      expect(screen.getByText('2026')).toBeInTheDocument();

      await user.keyboard('{Escape}');
      await user.click(trigger);
      expect(screen.getByText('August 2026')).toBeInTheDocument();
    });

    it('marks a fully out-of-range month/year as disabled and does not drill into it', async () => {
      const user = userEvent.setup();
      render(
        <DatePicker
          value={ANCHOR}
          onChange={() => {}}
          min={new Date(2026, 7, 10)}
          max={new Date(2026, 11, 31)}
        />,
      );
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));

      const january = screen.getByRole('gridcell', { name: 'January 2026' });
      expect(january).toHaveAttribute('aria-disabled', 'true');
      await user.click(january);
      // still on the month grid for 2026 - disabled month did not drill into the day grid
      expect(screen.getByText('2026')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /choose year/ }));
      const year2025 = screen.getByRole('gridcell', { name: '2025' });
      expect(year2025).toHaveAttribute('aria-disabled', 'true');
      await user.click(year2025);
      expect(screen.getByText('2016–2027')).toBeInTheDocument();
    });
  });

  describe('range selection mode', () => {
    function ControlledRangeDatePicker(props: {
      initialValue?: { start: Date; end?: Date };
      onRangeChange?: (range: { start: Date; end?: Date } | undefined) => void;
    }) {
      const [rangeValue, setRangeValue] = useState(props.initialValue);
      return (
        <DatePicker
          selectionMode="range"
          rangeValue={rangeValue}
          onRangeChange={(next) => {
            setRangeValue(next);
            props.onRangeChange?.(next);
          }}
        />
      );
    }

    it('shows the placeholder until a range is started', () => {
      render(<ControlledRangeDatePicker />);
      expect(screen.getByRole('button', { name: 'Select a date' })).toBeInTheDocument();
    });

    it('picking a first date sets the start, keeps the panel open, and shows just the start on the trigger', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(<ControlledRangeDatePicker onRangeChange={onRangeChange} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('gridcell', { name: 'August 2026' }));
      await user.click(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ }));

      expect(onRangeChange).toHaveBeenCalledWith({ start: new Date(2026, 7, 17), end: undefined });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'August 17, 2026' })).toBeInTheDocument();
    });

    it('picking a second, later date completes the range, closes the panel, and shows both endpoints', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(<ControlledRangeDatePicker onRangeChange={onRangeChange} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('gridcell', { name: 'August 2026' }));
      await user.click(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ }));
      await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 22, 2026/ }));

      expect(onRangeChange).toHaveBeenLastCalledWith({
        start: new Date(2026, 7, 17),
        end: new Date(2026, 7, 22),
      });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'August 17, 2026 – August 22, 2026' }),
      ).toBeInTheDocument();
    });

    it('swaps start/end when the second click lands before the first', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(<ControlledRangeDatePicker onRangeChange={onRangeChange} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('gridcell', { name: 'August 2026' }));
      await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 22, 2026/ }));
      await user.click(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ }));

      expect(onRangeChange).toHaveBeenLastCalledWith({
        start: new Date(2026, 7, 17),
        end: new Date(2026, 7, 22),
      });
    });

    it('marks the endpoints and the days between them in the grid', async () => {
      const user = userEvent.setup();
      render(
        <ControlledRangeDatePicker
          initialValue={{ start: new Date(2026, 7, 17), end: new Date(2026, 7, 20) }}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'August 17, 2026 – August 20, 2026' }));

      const start = screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ });
      const middle = screen.getByRole('gridcell', { name: /^Wednesday, August 19, 2026/ });
      const end = screen.getByRole('gridcell', { name: /^Thursday, August 20, 2026/ });
      const outside = screen.getByRole('gridcell', { name: /^Friday, August 21, 2026/ });

      expect(start).toHaveAttribute('data-range-start', 'true');
      expect(start).toHaveAttribute('aria-selected', 'true');
      expect(end).toHaveAttribute('data-range-end', 'true');
      expect(end).toHaveAttribute('aria-selected', 'true');
      expect(middle).toHaveAttribute('data-in-range', 'true');
      expect(middle).toHaveAttribute('aria-selected', 'true');
      expect(outside).not.toHaveAttribute('data-in-range');
      expect(outside).toHaveAttribute('aria-selected', 'false');
    });

    it('starts a new range after a previous one was already complete', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(
        <ControlledRangeDatePicker
          initialValue={{ start: new Date(2026, 7, 17), end: new Date(2026, 7, 20) }}
          onRangeChange={onRangeChange}
        />,
      );
      await user.click(screen.getByRole('button', { name: 'August 17, 2026 – August 20, 2026' }));
      await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 1, 2026/ }));

      expect(onRangeChange).toHaveBeenCalledWith({ start: new Date(2026, 7, 1), end: undefined });
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('selecting the focused day with Enter/Space works the same as clicking, for both endpoints', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(<ControlledRangeDatePicker onRangeChange={onRangeChange} />);
      await user.click(screen.getByRole('button'));
      await user.click(screen.getByRole('button', { name: /choose month/ }));
      await user.click(screen.getByRole('gridcell', { name: 'August 2026' }));
      // drilling into "August 2026" anchors focusedDate on Aug 1
      await user.keyboard('{Enter}');
      await user.keyboard('{ArrowRight}{ArrowRight}{Enter}');

      expect(onRangeChange).toHaveBeenCalledTimes(2);
      expect(onRangeChange).toHaveBeenLastCalledWith({
        start: new Date(2026, 7, 1),
        end: new Date(2026, 7, 3),
      });
    });
  });
});
