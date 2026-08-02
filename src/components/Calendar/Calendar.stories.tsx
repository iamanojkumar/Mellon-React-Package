import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from './Calendar';
import type { CalendarDateRange } from './Calendar';
import { Text } from '../Text/Text';

const meta: Meta<typeof Calendar> = {
  title: 'Data Display/Calendar',
  component: Calendar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => <Calendar defaultValue={new Date()} />,
};

/** `selectionMode="multiple"` selects any number of independent days. */
export const Multiple: Story = {
  render: () => <Calendar selectionMode="multiple" defaultValues={[]} />,
};

/** `selectionMode="range"`: the first click sets the start, the next sets the end. */
export const Range: Story = {
  render: () => <Calendar selectionMode="range" />,
};

/**
 * `selectionMode="none"` renders a read-only, keyboard-browsable grid — for
 * an event calendar driven entirely by `dayIndicator`, with no pick action.
 */
export const ReadOnlyWithIndicators: Story = {
  render: () => {
    const today = new Date();
    const eventDays = new Set([3, 8, 15, 21, 27]);
    return (
      <Calendar
        selectionMode="none"
        defaultValue={today}
        dayIndicator={(date) =>
          date.getMonth() === today.getMonth() && eventDays.has(date.getDate())
            ? 'brand'
            : undefined
        }
      />
    );
  },
};

export const MinMax: Story = {
  render: () => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 1);
    const max = new Date(today.getFullYear(), today.getMonth(), 20);
    return <Calendar defaultValue={today} min={min} max={max} />;
  },
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Calendar defaultValue={new Date()} />
      <Text size="sm" color="secondary" style={{ marginTop: 8 }}>
        The grid columns are proportional (repeat(7, 1fr)), so the calendar scales with its
        container.
      </Text>
    </div>
  ),
};

/**
 * Tab to a day, then use Arrow keys to move by day, Home/End for the start/
 * end of the week, and PageUp/PageDown (with Shift for a year jump) to
 * change month. Enter or Space selects the focused day.
 */
export const KeyboardNavigation: Story = {
  render: () => <Calendar defaultValue={new Date()} />,
};

/**
 * Uses `role="grid"`/`"row"`/`"columnheader"`/`"gridcell"` with a roving
 * tabindex — the same day-grid accessibility pattern as `DatePicker`'s day
 * view (see this component's own doc comment for what is and isn't reused).
 */
export const Accessibility: Story = {
  render: () => <Calendar defaultValue={new Date()} />,
};

export const Controlled: Story = {
  render: function ControlledCalendar() {
    const [range, setRange] = useState<CalendarDateRange | undefined>();
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          {range?.start
            ? `${range.start.toDateString()} ${range.end ? `– ${range.end.toDateString()}` : ''}`
            : 'No range selected'}
        </Text>
        <Calendar selectionMode="range" rangeValue={range} onRangeChange={setRange} />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => <Calendar defaultValue={new Date()} />,
};
