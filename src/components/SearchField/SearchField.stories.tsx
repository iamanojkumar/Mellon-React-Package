import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SearchField } from './SearchField';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof SearchField> = {
  title: 'Inputs/SearchField',
  component: SearchField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchField>;

export const Default: Story = {
  args: {
    'aria-label': 'Search',
    placeholder: 'Search…',
  },
};

export const WithValue: Story = {
  args: {
    'aria-label': 'Search',
    defaultValue: 'design tokens',
  },
};

export const Disabled: Story = {
  args: {
    'aria-label': 'Search',
    defaultValue: 'design tokens',
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 240 }}>
          <SearchField
            aria-label="Search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Search…"
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

const mockAIClient: AIClient = {
  complete: async ({ prompt }) => `${prompt.split('\n\n')[1] ?? prompt} tutorial for beginners`,
};

/**
 * `aiSearch` is a no-op without an ancestor `AIProvider` — this story wraps
 * a deterministic mock client so the "Search with AI" trigger actually
 * appears once there's a query. Click it to open the suggestion popover.
 */
export const WithAISearch: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  args: {
    'aria-label': 'Search',
    defaultValue: 'react hooks',
    aiSearch: true,
  },
};
