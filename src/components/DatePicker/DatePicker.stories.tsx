import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from './DatePicker';
import { Field } from '../Field/Field';

const meta: Meta<typeof DatePicker> = {
  title: 'Inputs/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DatePicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | undefined>(undefined);
      return <DatePicker value={value} onChange={setValue} />;
    }
    return <Demo />;
  },
};

export const WithDefaultValue: Story = {
  render: () => <DatePicker defaultValue={new Date(2026, 7, 15)} />,
};

export const MinMaxRange: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | undefined>(undefined);
      return (
        <DatePicker
          value={value}
          onChange={setValue}
          min={new Date(2026, 7, 10)}
          max={new Date(2026, 7, 20)}
          placeholder="Aug 10-20, 2026 only"
        />
      );
    }
    return <Demo />;
  },
};

export const Disabled: Story = {
  render: () => <DatePicker disabled placeholder="Select a date" />,
};

export const InsideField: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Date | undefined>(undefined);
      return (
        <Field label="Appointment date" helperText="Choose a weekday to schedule your visit.">
          <DatePicker value={value} onChange={setValue} />
        </Field>
      );
    }
    return <Demo />;
  },
};

/**
 * Click the trigger to open, ArrowLeft/Right/Up/Down to move a day at a
 * time, Home/End to jump to the start/end of the week, PageUp/PageDown to
 * change month (hold Shift for year), Enter/Space to select the focused
 * day, or Escape to close.
 */
export const KeyboardNavigation: Story = {
  render: () => <DatePicker defaultValue={new Date(2026, 7, 15)} />,
};
