import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';

const meta: Meta<typeof Table> = {
  title: 'Data Display/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table>;

const PEOPLE = [
  { name: 'Ada Lovelace', role: 'Mathematician', location: 'London' },
  { name: 'Grace Hopper', role: 'Rear Admiral', location: 'New York' },
  { name: 'Katherine Johnson', role: 'Physicist', location: 'West Virginia' },
];

export const Default: Story = {
  render: () => (
    <Table aria-label="People">
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Role</Table.HeaderCell>
          <Table.HeaderCell>Location</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {PEOPLE.map((person) => (
          <Table.Row key={person.name}>
            <Table.Cell>{person.name}</Table.Cell>
            <Table.Cell>{person.role}</Table.Cell>
            <Table.Cell>{person.location}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  ),
};

export const NarrowContainer: Story = {
  render: () => (
    <div style={{ maxWidth: 320 }}>
      <Table aria-label="People">
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Role</Table.HeaderCell>
            <Table.HeaderCell>Location</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {PEOPLE.map((person) => (
            <Table.Row key={person.name}>
              <Table.Cell>{person.name}</Table.Cell>
              <Table.Cell>{person.role}</Table.Cell>
              <Table.Cell>{person.location}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  ),
};
