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
});
