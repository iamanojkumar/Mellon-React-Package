import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Table } from './Table';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

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

  describe('aiTableQuery', () => {
    it('renders no AI toolbar when aiTableQuery is omitted', () => {
      render(<BasicTable />);
      expect(screen.queryByRole('button', { name: 'Ask with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI toolbar when aiTableQuery is true but no AIProvider is mounted', () => {
      render(
        <Table aria-label="People" aiTableQuery>
          <Table.Body>
            <Table.Row>
              <Table.Cell>Cell</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>,
      );
      expect(screen.queryByRole('button', { name: 'Ask with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI toolbar when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <BasicAITable />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Ask with AI' })).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: 'Ask a question about this table' }),
      ).toBeInTheDocument();
    });

    it('triggers the AI client with the typed question and the table content, read-only', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('Ada Lovelace is a mathematician.');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <BasicAITable />
        </AIProvider>,
      );

      await user.type(
        screen.getByRole('textbox', { name: 'Ask a question about this table' }),
        "what is Ada's role",
      );
      await user.click(screen.getByRole('button', { name: 'Ask with AI' }));
      const prompt = complete.mock.calls[0]?.[0].prompt as string;
      expect(prompt).toContain("what is Ada's role");
      expect(prompt).toContain('Ada Lovelace');
      expect(prompt).toContain('Mathematician');
      expect(await screen.findByText('Ada Lovelace is a mathematician.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI toolbar rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <BasicAITable />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});

function BasicAITable() {
  return (
    <Table aria-label="People" aiTableQuery>
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
      </Table.Body>
    </Table>
  );
}
