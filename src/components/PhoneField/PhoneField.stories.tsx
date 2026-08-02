import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PhoneField } from './PhoneField';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const meta: Meta<typeof PhoneField> = {
  title: 'Inputs/PhoneField',
  component: PhoneField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PhoneField>;

export const Default: Story = {
  args: {
    'aria-label': 'Phone',
    placeholder: '5551234567',
  },
};

export const PreselectedCountry: Story = {
  args: {
    'aria-label': 'Phone',
    defaultCountryCode: 'GB',
    placeholder: '7911123456',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Phone',
    defaultValue: '5551234567',
    disabled: true,
  },
};

export const WithoutCountrySelect: Story = {
  name: 'Without country select (hideCountrySelect)',
  args: {
    'aria-label': 'Phone',
    hideCountrySelect: true,
    placeholder: '(555) 123-4567',
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [countryCode, setCountryCode] = useState('US');
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 320 }}>
          <PhoneField
            aria-label="Phone"
            countryCode={countryCode}
            onCountryCodeChange={setCountryCode}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="5551234567"
          />
          <Text size="sm" color="secondary">
            Country: {countryCode} — Number: {value || '(empty)'}
          </Text>
        </Stack>
      );
    }
    return <Demo />;
  },
};
