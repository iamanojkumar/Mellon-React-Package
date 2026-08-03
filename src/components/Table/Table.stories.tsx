import type { Meta, StoryObj } from '@storybook/react';
import { Table } from './Table';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

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

const mockAIClient: AIClient = {
  complete: async () => 'Ada Lovelace is a mathematician based in London.',
};

/**
 * `aiTableQuery` mirrors `DataGrid`'s toolbar shape at a simpler dataset —
 * `Table` has no structured `data` prop, so the prompt is built from the
 * rendered table's own extracted text content rather than
 * `JSON.stringify`d rows. A no-op without an ancestor `AIProvider`; this
 * story wraps a deterministic mock client so the toolbar actually
 * appears. Read-only: no accept/reject, just an answer.
 */
export const WithAITableQuery: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  render: () => (
    <Table aria-label="People" aiTableQuery>
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
