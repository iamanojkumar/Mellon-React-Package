import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { MultiSelect } from './MultiSelect';
import type { SelectOption } from './MultiSelect';
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

const meta: Meta<typeof MultiSelect> = {
  title: 'Inputs/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {
  args: {
    'aria-label': 'Fruits',
    options: FRUITS,
    placeholder: 'Choose fruits…',
  },
};

export const Preselected: Story = {
  args: {
    'aria-label': 'Fruits',
    options: FRUITS,
    defaultValue: ['apple', 'banana'],
  },
};

export const ManySelected: Story = {
  name: 'Many selected (summarized)',
  args: {
    'aria-label': 'Fruits',
    options: FRUITS,
    defaultValue: ['apple', 'banana', 'date'],
  },
};

export const Invalid: Story = {
  args: {
    'aria-label': 'Fruits',
    options: FRUITS,
    invalid: true,
    placeholder: 'Choose fruits…',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Fruits',
    options: FRUITS,
    defaultValue: ['apple'],
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Stack gap="xs" style={{ maxWidth: 260 }}>
          <MultiSelect aria-label="Fruits" options={FRUITS} value={value} onChange={setValue} />
          <Text size="sm" color="secondary">
            Value: {value.length > 0 ? value.join(', ') : '(none)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
