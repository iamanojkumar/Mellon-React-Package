import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DataGrid } from './DataGrid';
import type { DataGridColumn } from './DataGrid';
import { Text } from '../Text/Text';

interface User {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  joined: string;
}

const users: User[] = [
  { id: 'u1', name: 'Ada Lovelace', role: 'Admin', status: 'active', joined: '2024-01-12' },
  { id: 'u2', name: 'Grace Hopper', role: 'Engineer', status: 'active', joined: '2023-11-03' },
  { id: 'u3', name: 'Alan Turing', role: 'Engineer', status: 'suspended', joined: '2022-06-20' },
  { id: 'u4', name: 'Katherine Johnson', role: 'Analyst', status: 'invited', joined: '2024-04-08' },
  { id: 'u5', name: 'Margaret Hamilton', role: 'Engineer', status: 'active', joined: '2021-09-15' },
];

const statusColor: Record<User['status'], 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  invited: 'warning',
  suspended: 'secondary',
};

const baseColumns: DataGridColumn<User>[] = [
  { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
  { key: 'role', header: 'Role', accessor: (row) => row.role, sortable: true },
  {
    key: 'status',
    header: 'Status',
    accessor: (row) => (
      <Text weight="medium" color={statusColor[row.status]}>
        {row.status}
      </Text>
    ),
    sortValue: (row) => row.status,
    sortable: true,
  },
  { key: 'joined', header: 'Joined', accessor: (row) => row.joined, sortable: true, align: 'end' },
];

const meta: Meta<typeof DataGrid> = {
  title: 'Data Display/DataGrid',
  component: DataGrid,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataGrid>;

export const Default: Story = {
  render: () => (
    <DataGrid columns={baseColumns} data={users} getRowId={(row) => row.id} caption="Users" />
  ),
};

export const Sortable: Story = {
  render: () => (
    <DataGrid
      columns={baseColumns}
      data={users}
      getRowId={(row) => row.id}
      caption="Users, sorted by joined date"
      defaultSort={{ key: 'joined', direction: 'desc' }}
    />
  ),
};

export const Selectable: Story = {
  render: () => (
    <DataGrid
      columns={baseColumns}
      data={users}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="Users"
      selectable
      defaultSelectedRowIds={['u1']}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataGrid columns={baseColumns} data={[]} getRowId={(row: User) => row.id} caption="Users" />
  ),
};

export const CustomEmptyState: Story = {
  render: () => (
    <DataGrid
      columns={baseColumns}
      data={[]}
      getRowId={(row: User) => row.id}
      caption="Users"
      emptyState={<Text color="secondary">No users match the current filters.</Text>}
    />
  ),
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <DataGrid columns={baseColumns} data={users} getRowId={(row) => row.id} caption="Users" />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <DataGrid
      columns={baseColumns}
      data={users}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="Users"
      selectable
    />
  ),
};

export const Controlled: Story = {
  render: function ControlledDataGrid() {
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    return (
      <>
        <Text size="sm" style={{ marginBottom: 8 }}>
          {selectedRowIds.length} selected
        </Text>
        <DataGrid
          columns={baseColumns}
          data={users}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          caption="Users"
          selectable
          selectedRowIds={selectedRowIds}
          onSelectionChange={setSelectedRowIds}
        />
      </>
    );
  },
};

export const Uncontrolled: Story = {
  render: () => (
    <DataGrid
      columns={baseColumns}
      data={users}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="Users"
      selectable
    />
  ),
};
