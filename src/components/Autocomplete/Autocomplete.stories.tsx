import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Autocomplete } from './Autocomplete';
import type { ComboboxOption } from './Autocomplete';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const CITIES: ComboboxOption[] = [
  { value: 'nyc', label: 'New York City' },
  { value: 'la', label: 'Los Angeles' },
  { value: 'chi', label: 'Chicago' },
  { value: 'hou', label: 'Houston' },
  { value: 'phx', label: 'Phoenix' },
  { value: 'phi', label: 'Philadelphia' },
];

const meta: Meta<typeof Autocomplete> = {
  title: 'Inputs/Autocomplete',
  component: Autocomplete,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Autocomplete>;

export const Default: Story = {
  args: {
    'aria-label': 'City',
    options: CITIES,
    placeholder: 'Type any city…',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'City',
    options: CITIES,
    invalid: true,
    placeholder: 'Type any city…',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'City',
    options: CITIES,
    defaultValue: 'nyc',
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 260 }}>
          <Autocomplete
            aria-label="City"
            options={CITIES}
            value={value}
            onChange={setValue}
            placeholder="Type any city…"
          />
          <Text size="sm" color="secondary">
            Value: {value || '(empty)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
