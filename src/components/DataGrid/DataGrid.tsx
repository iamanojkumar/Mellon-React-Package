import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '../Table/Table';
import { Checkbox } from '../Checkbox/Checkbox';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './DataGrid.module.css';

export type DataGridSortDirection = 'asc' | 'desc';

export interface DataGridSort {
  key: string;
  direction: DataGridSortDirection;
}

export type DataGridAlign = 'start' | 'center' | 'end';

export interface DataGridColumn<T> {
  key: string;
  header: ReactNode;
  /** What's rendered in each cell for this column. */
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  /** What's compared when sorting by this column. Defaults to treating `accessor`'s return value as already comparable — only correct when `accessor` returns a plain string/number. Pass this explicitly whenever `accessor` returns anything else (formatted currency, dates, JSX). */
  sortValue?: (row: T) => string | number;
  align?: DataGridAlign;
}

export interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  data: T[];
  /** Stable identifier for each row — required for selection state and list keys. */
  getRowId: (row: T) => string;
  /** Accessible label for a row's selection checkbox, e.g. `(row) => row.name`. Defaults to a 1-indexed "row N" label. */
  getRowLabel?: (row: T) => string;
  sort?: DataGridSort | null;
  defaultSort?: DataGridSort | null;
  onSortChange?: (sort: DataGridSort | null) => void;
  selectable?: boolean;
  selectedRowIds?: string[];
  defaultSelectedRowIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Visible table caption — also the table's accessible name. */
  caption?: ReactNode;
  /** Shown in place of rows when `data` is empty. Defaults to `'No data'`. */
  emptyState?: ReactNode;
  className?: string;
}

const ChevronIcon = (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path
      d="M2 3.5L5 6.5L8 3.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * `Table`-superset: composes `Table`/`Table.Head`/`Table.Body`/`Table.Row`/
 * `Table.HeaderCell`/`Table.Cell` directly (not their CSS classes only —
 * real composition, which sidesteps any ancestor-selector CSS-reuse risk
 * for `Table.module.css`'s `.head .row` rule) and layers column sorting and
 * row selection on top, entirely data-driven from `columns`/`data` rather
 * than children.
 *
 * Scope decision (see docs/SPEC.md's Phase 17 note): a "Table-superset",
 * **not** a dedicated virtualized-rendering engine. This library has no
 * windowing/virtualization dependency anywhere else, and adding one is a
 * disproportionate scope increase for a general-purpose design-system grid
 * — large-dataset virtualization is left to the consumer (e.g. wrapping
 * `data` with their own windowing library) if their use case needs it.
 * Consistently, this also stays plain `<table>` semantics with `aria-sort`
 * on sortable `<th>`s (the standard "sortable data table" accessible
 * pattern) rather than `role="grid"` — that ARIA role commits to full 2D
 * arrow-key cell navigation, which isn't implemented here, and claiming the
 * role without it would be a worse accessibility mismatch than not using it.
 *
 * Sorting is 3-state per sortable column (asc -> desc -> unsorted) via a
 * `<button>` inside the header cell, the pattern the WAI-ARIA APG's
 * sortable-table example itself uses. Row selection reuses `Checkbox`
 * directly (a fully self-contained, already-exported component — real
 * composition again, not reimplementation) for both the per-row boxes and
 * the header's "select all", which gets `indeterminate` when some but not
 * all rows are selected.
 */
export function DataGrid<T>({
  columns,
  data,
  getRowId,
  getRowLabel,
  sort,
  defaultSort = null,
  onSortChange,
  selectable = false,
  selectedRowIds,
  defaultSelectedRowIds = [],
  onSelectionChange,
  caption,
  emptyState = 'No data',
  className,
}: DataGridProps<T>) {
  const [activeSort, setActiveSort] = useControllableState<DataGridSort | null>({
    value: sort,
    defaultValue: defaultSort,
    onChange: onSortChange,
  });
  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: selectedRowIds,
    defaultValue: defaultSelectedRowIds,
    onChange: onSelectionChange,
  });

  const sortedData = useMemo(() => {
    if (!activeSort) return data;
    const column = columns.find((c) => c.key === activeSort.key);
    if (!column) return data;
    const getValue =
      column.sortValue ?? ((row: T) => column.accessor(row) as unknown as string | number);
    const sorted = [...data].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (av === bv) return 0;
      return av > bv ? 1 : -1;
    });
    return activeSort.direction === 'desc' ? sorted.reverse() : sorted;
  }, [data, columns, activeSort]);

  function toggleSort(key: string) {
    if (!activeSort || activeSort.key !== key) {
      setActiveSort({ key, direction: 'asc' });
    } else if (activeSort.direction === 'asc') {
      setActiveSort({ key, direction: 'desc' });
    } else {
      setActiveSort(null);
    }
  }

  const allRowIds = useMemo(() => data.map(getRowId), [data, getRowId]);
  const allSelected = allRowIds.length > 0 && allRowIds.every((id) => selectedIds.includes(id));
  const someSelected = !allSelected && allRowIds.some((id) => selectedIds.includes(id));

  function toggleAll() {
    setSelectedIds(allSelected ? [] : allRowIds);
  }

  function toggleRow(id: string) {
    setSelectedIds(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  }

  const columnCount = columns.length + (selectable ? 1 : 0);

  return (
    <Table className={mergeClasses(styles.dataGrid, className)}>
      {caption && <caption className={styles.caption}>{caption}</caption>}
      <TableHead>
        <TableRow>
          {selectable && (
            <TableHeaderCell className={styles.selectCell}>
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
                disabled={allRowIds.length === 0}
              />
            </TableHeaderCell>
          )}
          {columns.map((column) => {
            const sortDirection =
              activeSort && activeSort.key === column.key ? activeSort.direction : undefined;
            const ariaSort = !column.sortable
              ? undefined
              : sortDirection === 'asc'
                ? 'ascending'
                : sortDirection === 'desc'
                  ? 'descending'
                  : 'none';

            return (
              <TableHeaderCell
                key={column.key}
                aria-sort={ariaSort}
                data-align={column.align}
                className={styles.headerCell}
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => toggleSort(column.key)}
                  >
                    <span>{column.header}</span>
                    <span
                      className={styles.sortIcon}
                      data-direction={sortDirection}
                      aria-hidden="true"
                    >
                      {ChevronIcon}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </TableHeaderCell>
            );
          })}
        </TableRow>
      </TableHead>
      <TableBody>
        {sortedData.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columnCount} className={styles.emptyCell}>
              {emptyState}
            </TableCell>
          </TableRow>
        ) : (
          sortedData.map((row, index) => {
            const id = getRowId(row);
            const isSelected = selectedIds.includes(id);
            const rowLabel = getRowLabel?.(row) ?? `row ${index + 1}`;

            return (
              <TableRow key={id} data-selected={isSelected || undefined}>
                {selectable && (
                  <TableCell className={styles.selectCell}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(id)}
                      aria-label={`Select ${rowLabel}`}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell key={column.key} data-align={column.align} className={styles.cell}>
                    {column.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

DataGrid.displayName = 'DataGrid';
