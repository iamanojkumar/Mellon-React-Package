import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Table } from './Table';

function BasicTable() {
  return (
    <Table aria-label="People">
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell>Name</Table.HeaderCell>
          <Table.HeaderCell>Role</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row>
          <Table.Cell>Ada Lovelace</Table.Cell>
          <Table.Cell>Mathematician</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Grace Hopper</Table.Cell>
          <Table.Cell>Rear Admiral</Table.Cell>
        </Table.Row>
      </Table.Body>
    </Table>
  );
}

describe('Table', () => {
  it('renders a real table element with real thead/tbody/tr/th/td', () => {
    render(<BasicTable />);
    const table = screen.getByRole('table', { name: 'People' });
    expect(table.tagName).toBe('TABLE');
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header row + 2 body rows
  });

  it('gives header cells scope="col" by default', () => {
    render(<BasicTable />);
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('scope', 'col');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicTable />);
    await expectNoA11yViolations(container);
  });

  it('merges a custom className on the table element', () => {
    render(
      <Table aria-label="Custom" className="custom">
        <Table.Body>
          <Table.Row>
            <Table.Cell>Cell</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>,
    );
    expect(screen.getByRole('table').className).toContain('custom');
  });
});
