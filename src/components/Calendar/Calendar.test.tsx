import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Calendar } from './Calendar';
import type { CalendarDateRange } from './Calendar';
import { startOfDay } from '../../utilities/dateGrid';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

// Aug 15, 2026 is a Saturday - fixed via `defaultValue` so grid position is
// deterministic without faking timers (same anchor DatePicker's tests use).
const ANCHOR = new Date(2026, 7, 15);

function ControlledCalendar(props: {
  initialValue?: Date;
  onChange?: (date: Date | undefined) => void;
  min?: Date;
  max?: Date;
}) {
  const [value, setValue] = useState<Date | undefined>(props.initialValue);
  return (
    <Calendar
      value={value}
      min={props.min}
      max={props.max}
      onChange={(date) => {
        setValue(date);
        props.onChange?.(date);
      }}
    />
  );
}

function ControlledMultipleCalendar(props: { initialValues?: Date[] }) {
  const [values, setValues] = useState<Date[]>(props.initialValues ?? []);
  return <Calendar selectionMode="multiple" values={values} onValuesChange={setValues} />;
}

function ControlledRangeCalendar(props: {
  initialValue?: CalendarDateRange;
  onRangeChange?: (range: CalendarDateRange | undefined) => void;
}) {
  const [rangeValue, setRangeValue] = useState(props.initialValue);
  return (
    <Calendar
      selectionMode="range"
      rangeValue={rangeValue}
      onRangeChange={(next) => {
        setRangeValue(next);
        props.onRangeChange?.(next);
      }}
    />
  );
}

describe('Calendar', () => {
  it('renders the month grid anchored on the selected value', () => {
    render(<Calendar value={ANCHOR} onChange={() => {}} />);
    expect(screen.getByText('August 2026')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('does not steal focus on mount', () => {
    render(<Calendar defaultValue={ANCHOR} />);
    expect(document.body).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Calendar defaultValue={ANCHOR} />);
    await expectNoA11yViolations(container);
  });

  it('marks the selected day and calls onChange on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledCalendar initialValue={ANCHOR} onChange={onChange} />);
    const target = screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ });

    await user.click(target);
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 17));
    expect(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('navigates days with arrow keys and selects the focused day with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledCalendar initialValue={ANCHOR} onChange={onChange} />);
    screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }).focus();

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowDown}');
    // from Aug 15 (Sat): +1 -> 16 (Sun), +1 -> 17 (Mon), +7 -> 24 (Mon)
    expect(screen.getByRole('gridcell', { name: /^Monday, August 24, 2026/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(new Date(2026, 7, 24));
  });

  it('jumps to the start/end of the week with Home/End', async () => {
    const user = userEvent.setup();
    render(<ControlledCalendar initialValue={ANCHOR} />);
    screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }).focus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('gridcell', { name: /^Sunday, August 9, 2026/ })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveFocus();
  });

  it('navigates months with the header buttons and with PageUp/Shift+PageDown', async () => {
    const user = userEvent.setup();
    render(<ControlledCalendar initialValue={ANCHOR} />);
    expect(screen.getByText('August 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next month' }));
    expect(screen.getByText('September 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous month' }));
    expect(screen.getByText('August 2026')).toBeInTheDocument();

    screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }).focus();
    await user.keyboard('{PageDown}');
    expect(screen.getByText('September 2026')).toBeInTheDocument();

    await user.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(screen.getByText('September 2027')).toBeInTheDocument();
  });

  it('marks dates outside min/max as disabled and does not select them', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ControlledCalendar
        initialValue={ANCHOR}
        min={new Date(2026, 7, 10)}
        max={new Date(2026, 7, 20)}
        onChange={onChange}
      />,
    );

    const outOfRangeCell = screen.getByRole('gridcell', { name: /^Sunday, August 2, 2026/ });
    expect(outOfRangeCell).toHaveAttribute('aria-disabled', 'true');

    await user.click(outOfRangeCell);
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('multiple selection mode', () => {
    it('accumulates independently selected days and calls onValuesChange', async () => {
      const user = userEvent.setup();
      render(<ControlledMultipleCalendar initialValues={[ANCHOR]} />);

      await user.click(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ }));
      expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
      expect(screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    it('deselects an already-selected day on repeat click', async () => {
      const user = userEvent.setup();
      render(<ControlledMultipleCalendar initialValues={[ANCHOR]} />);

      await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }));
      expect(screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ })).toHaveAttribute(
        'aria-selected',
        'false',
      );
    });
  });

  describe('range selection mode', () => {
    it('picking a first date sets the start with no end', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(<ControlledRangeCalendar onRangeChange={onRangeChange} />);
      const today = startOfDay(new Date());

      await user.click(screen.getByRole('gridcell', { current: 'date' }));
      expect(onRangeChange).toHaveBeenCalledWith({ start: today, end: undefined });
    });

    it('marks the endpoints and days between them in the grid', () => {
      render(
        <ControlledRangeCalendar
          initialValue={{ start: new Date(2026, 7, 17), end: new Date(2026, 7, 20) }}
        />,
      );

      const start = screen.getByRole('gridcell', { name: /^Monday, August 17, 2026/ });
      const middle = screen.getByRole('gridcell', { name: /^Wednesday, August 19, 2026/ });
      const end = screen.getByRole('gridcell', { name: /^Thursday, August 20, 2026/ });
      const outside = screen.getByRole('gridcell', { name: /^Friday, August 21, 2026/ });

      expect(start).toHaveAttribute('data-range-start', 'true');
      expect(start).toHaveAttribute('aria-selected', 'true');
      expect(end).toHaveAttribute('data-range-end', 'true');
      expect(middle).toHaveAttribute('data-in-range', 'true');
      expect(outside).not.toHaveAttribute('data-in-range');
      expect(outside).toHaveAttribute('aria-selected', 'false');
    });

    it('starting a new range after completion resets to a single start date', async () => {
      const user = userEvent.setup();
      const onRangeChange = vi.fn();
      render(
        <ControlledRangeCalendar
          initialValue={{ start: new Date(2026, 7, 17), end: new Date(2026, 7, 20) }}
          onRangeChange={onRangeChange}
        />,
      );

      await user.click(screen.getByRole('gridcell', { name: /^Saturday, August 1, 2026/ }));
      expect(onRangeChange).toHaveBeenCalledWith({ start: new Date(2026, 7, 1), end: undefined });
    });
  });

  describe('selectionMode="none"', () => {
    it('never marks a day aria-selected, even after clicking it', async () => {
      const user = userEvent.setup();
      render(<Calendar selectionMode="none" defaultValue={ANCHOR} />);
      const cell = screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ });
      expect(cell).not.toHaveAttribute('aria-selected');

      await user.click(cell);
      expect(cell).not.toHaveAttribute('aria-selected');
    });

    it('still supports keyboard browsing', async () => {
      const user = userEvent.setup();
      render(<Calendar selectionMode="none" defaultValue={ANCHOR} />);
      screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ }).focus();
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('gridcell', { name: /^Sunday, August 16, 2026/ })).toHaveFocus();
    });
  });

  describe('dayIndicator', () => {
    it('renders a colored marker on days the callback flags', () => {
      render(
        <Calendar
          defaultValue={ANCHOR}
          dayIndicator={(date) => (date.getDate() === 15 ? 'brand' : undefined)}
        />,
      );
      const flagged = screen.getByRole('gridcell', { name: /^Saturday, August 15, 2026/ });
      const unflagged = screen.getByRole('gridcell', { name: /^Sunday, August 16, 2026/ });

      expect(flagged.querySelector('[data-color="brand"]')).toBeInTheDocument();
      expect(unflagged.querySelector('[data-color]')).not.toBeInTheDocument();
    });
  });

  describe('aiQuery', () => {
    it('renders no AI trigger when aiQuery is omitted', () => {
      render(<Calendar defaultValue={ANCHOR} />);
      expect(screen.queryByRole('button', { name: 'Ask AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiQuery is true but no AIProvider is mounted', () => {
      render(<Calendar defaultValue={ANCHOR} aiQuery />);
      expect(screen.queryByRole('button', { name: 'Ask AI' })).not.toBeInTheDocument();
    });

    it('renders the AI query field and trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Calendar defaultValue={ANCHOR} aiQuery />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Ask AI' })).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: 'Ask a question about this calendar' }),
      ).toBeInTheDocument();
    });

    it('triggers the AI client with the typed question and the visible month, and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('Nothing is marked on that day.');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <Calendar defaultValue={ANCHOR} aiQuery />
        </AIProvider>,
      );

      await user.type(
        screen.getByRole('textbox', { name: 'Ask a question about this calendar' }),
        "what's on Friday",
      );
      await user.click(screen.getByRole('button', { name: 'Ask AI' }));
      const prompt = complete.mock.calls[0]?.[0].prompt as string;
      expect(prompt).toContain("what's on Friday");
      expect(prompt).toContain('August 2026');
      expect(await screen.findByText('Nothing is marked on that day.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI query row rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Calendar defaultValue={ANCHOR} aiQuery />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
