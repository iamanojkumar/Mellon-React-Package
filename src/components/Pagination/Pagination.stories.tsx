import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Pagination } from './Pagination';
import { Text } from '../Text/Text';

const meta: Meta<typeof Pagination> = {
  title: 'Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  render: () => <Pagination totalPages={5} defaultPage={1} />,
};

/** With enough pages, both edges collapse into ellipses around the current page. */
export const ManyPages: Story = {
  render: () => <Pagination totalPages={20} defaultPage={10} />,
};

export const WiderSiblingWindow: Story = {
  render: () => <Pagination totalPages={20} defaultPage={10} siblingCount={2} boundaryCount={2} />,
};

export const Disabled: Story = {
  render: () => <Pagination totalPages={10} defaultPage={4} disabled />,
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 260 }}>
      <Pagination totalPages={20} defaultPage={10} />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => <Pagination totalPages={5} defaultPage={2} />,
};

export const Controlled: Story = {
  render: function ControlledPagination() {
    const [page, setPage] = useState(1);
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          Page {page} of 10
        </Text>
        <Pagination totalPages={10} page={page} onPageChange={setPage} />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => <Pagination totalPages={10} defaultPage={1} />,
};
