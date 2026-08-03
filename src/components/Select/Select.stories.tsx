import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';
import type { SelectOption } from './Select';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const FRUITS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
  { value: 'date', label: 'Date' },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
];

const meta: Meta<typeof Select> = {
  title: 'Inputs/Select',
  component: Select,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    placeholder: 'Choose a fruit…',
  },
};

export const Preselected: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    defaultValue: 'banana',
  },
};

export const WithDisabledOption: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    placeholder: 'Cherry is out of stock',
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    invalid: true,
    placeholder: 'Choose a fruit…',
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
        <Stack gap="xs" style={{ maxWidth: 240 }}>
          <Select aria-label="Fruit" options={FRUITS} value={value} onChange={setValue} />
          <Text size="sm" color="secondary">
            Value: {value || '(none)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};

/**
 * `aiSuggest` follows `CommandPalette`'s `aiSearch` shape, not the popover
 * flagships' — `resolve` is entirely a consumer-owned function (it may call
 * an `AIClient` internally or not), so this story doesn't need an
 * `AIProvider` at all. The mock below stands in for "an LLM recommended the
 * ripest fruit."
 */
export const WithAISuggest: Story = {
  args: {
    'aria-label': 'Fruit',
    options: FRUITS,
    placeholder: 'Choose a fruit…',
    aiSuggest: {
      resolve: async () => 'fig',
    },
  },
};
