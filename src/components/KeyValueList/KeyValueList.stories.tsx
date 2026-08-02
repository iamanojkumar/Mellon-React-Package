import type { Meta, StoryObj } from '@storybook/react';
import { KeyValueList } from './KeyValueList';

const meta: Meta<typeof KeyValueList> = {
  title: 'Data Display/KeyValueList',
  component: KeyValueList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof KeyValueList>;

export const Default: Story = {
  render: () => (
    <KeyValueList
      style={{ maxWidth: 280 }}
      items={[
        { label: 'Order ID', value: '#48213' },
        { label: 'Status', value: 'Shipped' },
        { label: 'Total', value: '$128.50' },
      ]}
    />
  ),
};
