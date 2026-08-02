import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { DataGrid } from './DataGrid';
import type { DataGridColumn } from './DataGrid';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: 'p1', name: 'Charlie', age: 35 },
  { id: 'p2', name: 'Alice', age: 28 },
  { id: 'p3', name: 'Bob', age: 42 },
];

const columns: DataGridColumn<Person>[] = [
  { key: 'name', header: 'Name', accessor: (row) => row.name, sortable: true },
  { key: 'age', header: 'Age', accessor: (row) => row.age, sortable: true },
];

function bodyRows() {
  const rowgroups = screen.getAllByRole('rowgroup');
  const tbody = rowgroups[1];
  if (!tbody) throw new Error('Expected a <tbody> rowgroup');
  return within(tbody).getAllByRole('row');
}

function firstCellTexts() {
  return bodyRows().map((row) => {
    const cell = within(row).getAllByRole('cell')[0];
    if (!cell) throw new Error('Expected at least one cell in row');
    return cell.textContent;
  });
}

function ControlledSelection() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <DataGrid
      columns={columns}
      data={people}
      getRowId={(row) => row.id}
      selectable
      selectedRowIds={selected}
      onSelectionChange={setSelected}
    />
  );
}

describe('DataGrid', () => {
  it('renders a caption as the accessible name and column headers', () => {
    render(
      <DataGrid columns={columns} data={people} getRowId={(row) => row.id} caption="People" />,
    );
    expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Name/ })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Age/ })).toBeInTheDocument();
  });

  it('renders one row per data item with accessor output', () => {
    render(<DataGrid columns={columns} data={people} getRowId={(row) => row.id} />);
    expect(bodyRows()).toHaveLength(3);
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the empty state when data is empty', () => {
    render(<DataGrid columns={columns} data={[]} getRowId={(row) => row.id} />);
    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('renders a custom empty state', () => {
    render(
      <DataGrid columns={columns} data={[]} getRowId={(row) => row.id} emptyState="Nothing here" />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('a non-sortable column has no sort button and no aria-sort', () => {
    const readOnlyColumns: DataGridColumn<Person>[] = [
      { key: 'name', header: 'Name', accessor: (row) => row.name },
    ];
    render(<DataGrid columns={readOnlyColumns} data={people} getRowId={(row) => row.id} />);
    const header = screen.getByRole('columnheader', { name: 'Name' });
    expect(header).not.toHaveAttribute('aria-sort');
    expect(within(header).queryByRole('button')).not.toBeInTheDocument();
  });

  it('cycles a sortable column through ascending -> descending -> unsorted', async () => {
    const user = userEvent.setup();
    render(<DataGrid columns={columns} data={people} getRowId={(row) => row.id} />);
    const nameHeader = screen.getByRole('columnheader', { name: /Name/ });
    const sortButton = within(nameHeader).getByRole('button');

    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(firstCellTexts()).toEqual(['Alice', 'Bob', 'Charlie']);

    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
    expect(firstCellTexts()).toEqual(['Charlie', 'Bob', 'Alice']);

    await user.click(sortButton);
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');
    expect(firstCellTexts()).toEqual(['Charlie', 'Alice', 'Bob']);
  });

  it("sorting one column clears the previous column's sort", async () => {
    const user = userEvent.setup();
    render(<DataGrid columns={columns} data={people} getRowId={(row) => row.id} />);
    await user.click(
      within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'),
    );
    await user.click(within(screen.getByRole('columnheader', { name: /Age/ })).getByRole('button'));

    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none');
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('calls onSortChange with the new sort state', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(
      <DataGrid
        columns={columns}
        data={people}
        getRowId={(row) => row.id}
        onSortChange={onSortChange}
      />,
    );
    await user.click(
      within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'),
    );
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
  });

  describe('selectable', () => {
    it('renders a select-all checkbox and per-row checkboxes', () => {
      render(<DataGrid columns={columns} data={people} getRowId={(row) => row.id} selectable />);
      expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
      expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    });

    it('selecting a row calls onSelectionChange with its id', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(
        <DataGrid
          columns={columns}
          data={people}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          selectable
          onSelectionChange={onSelectionChange}
        />,
      );
      await user.click(screen.getByRole('checkbox', { name: 'Select Charlie' }));
      expect(onSelectionChange).toHaveBeenCalledWith(['p1']);
    });

    it('select-all selects every row and becomes indeterminate then unchecked as rows are toggled', async () => {
      const user = userEvent.setup();
      render(<ControlledSelection />);

      const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });
      await user.click(selectAll);
      expect(selectAll).toBeChecked();

      await user.click(screen.getByRole('checkbox', { name: 'Select row 1' }));
      expect(selectAll).not.toBeChecked();
      expect(selectAll).toHaveAttribute('aria-checked', 'mixed');
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <DataGrid
        columns={columns}
        data={people}
        getRowId={(row) => row.id}
        caption="People"
        selectable
      />,
    );
    await expectNoA11yViolations(container);
  });

  describe('aiTableQuery / aiRowExplain', () => {
    it('renders no AI affordances when the flags are omitted', () => {
      render(<DataGrid columns={columns} data={people} getRowId={(row) => row.id} />);
      expect(screen.queryByRole('button', { name: 'Ask with AI' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Explain .* with AI/)).not.toBeInTheDocument();
    });

    it('renders no AI affordances when the flags are true but no AIProvider is mounted', () => {
      render(
        <DataGrid
          columns={columns}
          data={people}
          getRowId={(row) => row.id}
          aiTableQuery
          aiRowExplain
        />,
      );
      expect(screen.queryByRole('button', { name: 'Ask with AI' })).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Explain .* with AI/)).not.toBeInTheDocument();
    });

    it('renders the toolbar query trigger and per-row explain triggers when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <DataGrid
            columns={columns}
            data={people}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            aiTableQuery
            aiRowExplain
          />
        </AIProvider>,
      );
      expect(screen.getByLabelText('Ask a question about this table')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ask with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Explain Charlie with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Explain Alice with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Explain Bob with AI' })).toBeInTheDocument();
    });

    it('asking a table question sends the query and the sorted data to the AI client', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('Charlie is the oldest.') };
      render(
        <AIProvider client={client}>
          <DataGrid columns={columns} data={people} getRowId={(row) => row.id} aiTableQuery />
        </AIProvider>,
      );

      await user.type(
        screen.getByLabelText('Ask a question about this table'),
        'who is the oldest?',
      );
      await user.click(screen.getByRole('button', { name: 'Ask with AI' }));

      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('who is the oldest?') }),
      );
      await screen.findByText('Charlie is the oldest.');
    });

    it('explaining a row sends that row to the AI client', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('Charlie is 35 years old.'),
      };
      render(
        <AIProvider client={client}>
          <DataGrid
            columns={columns}
            data={people}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            aiRowExplain
          />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain Charlie with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Charlie') }),
      );
      await screen.findByText('Charlie is 35 years old.');
    });
  });
});
