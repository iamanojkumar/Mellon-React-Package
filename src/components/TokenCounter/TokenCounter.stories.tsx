import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TokenCounter } from './TokenCounter';
import { TextArea } from '../TextArea/TextArea';
import { Stack } from '../Stack/Stack';

const meta: Meta<typeof TokenCounter> = {
  title: 'AI Chat/TokenCounter',
  component: TokenCounter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TokenCounter>;

export const Default: Story = {
  args: {
    value: 'Explain how flexbox centering works.',
  },
};

export const WithLimit: Story = {
  args: {
    value: 'Explain how flexbox centering works.',
    limit: 50,
  },
};

export const OverLimit: Story = {
  args: {
    value:
      'Explain how flexbox centering works in as much detail as possible, covering every edge case.',
    limit: 20,
  },
};

export const LiveInAComposer: Story = {
  render: () => {
    function Demo() {
      const [value, setValue] = useState('');
      return (
        <Stack gap="xs" style={{ maxWidth: 320 }}>
          <TextArea
            aria-label="Message"
            placeholder="Type a message…"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <TokenCounter value={value} limit={50} />
        </Stack>
      );
    }
    return <Demo />;
  },
};
