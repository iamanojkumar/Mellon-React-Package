import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox } from './Combobox';
import type { ComboboxOption } from './Combobox';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const FRUITS: ComboboxOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const meta: Meta<typeof Combobox> = {
  title: 'Inputs/Combobox',
  component: Combobox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    placeholder: 'Type to search…',
  },
};

export const Preselected: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    defaultValue: 'banana',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    invalid: true,
    placeholder: 'Type to search…',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    defaultValue: 'apple',
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 260 }}>
          <Combobox
            aria-label="Fruit"
            options={FRUITS}
            value={value}
            onChange={setValue}
            placeholder="Type to search…"
          />
          <Text size="sm" color="secondary">
            Value: {value || '(none)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
