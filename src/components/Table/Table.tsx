import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Table.module.css';

/**
 * Compound, but simple — no shared state, just semantic wrappers around
 * real native table elements (`as` doesn't apply, same reasoning as
 * `Input`/`Portal`). Sorting/selection is the separate `Data Grid`
 * component in SPEC's inventory; this is deliberately just
 * structure/styling, wrapped in a scrollable container for responsive
 * overflow.
 */
export type TableProps = ComponentPropsWithoutRef<'table'>;

function TableRoot({ className, children, ...rest }: TableProps) {
  return (
    <div className={styles.scrollContainer}>
      <table className={mergeClasses(styles.table, className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export type TableHeadProps = ComponentPropsWithoutRef<'thead'>;

function TableHead({ className, ...rest }: TableHeadProps) {
  return <thead className={mergeClasses(styles.head, className)} {...rest} />;
}

export type TableBodyProps = ComponentPropsWithoutRef<'tbody'>;

function TableBody({ className, ...rest }: TableBodyProps) {
  return <tbody className={mergeClasses(styles.body, className)} {...rest} />;
}

export type TableRowProps = ComponentPropsWithoutRef<'tr'>;

function TableRow({ className, ...rest }: TableRowProps) {
  return <tr className={mergeClasses(styles.row, className)} {...rest} />;
}

export type TableHeaderCellProps = ComponentPropsWithoutRef<'th'>;

function TableHeaderCell({ className, scope = 'col', ...rest }: TableHeaderCellProps) {
  return <th scope={scope} className={mergeClasses(styles.headerCell, className)} {...rest} />;
}

export type TableCellProps = ComponentPropsWithoutRef<'td'>;

function TableCell({ className, ...rest }: TableCellProps) {
  return <td className={mergeClasses(styles.cell, className)} {...rest} />;
}

TableHead.displayName = 'Table.Head';
TableBody.displayName = 'Table.Body';
TableRow.displayName = 'Table.Row';
TableHeaderCell.displayName = 'Table.HeaderCell';
TableCell.displayName = 'Table.Cell';

/**
 * Compound component: `<Table><Table.Head><Table.Row><Table.HeaderCell>...</Table.HeaderCell></Table.Row></Table.Head><Table.Body>...</Table.Body></Table>`.
 * Parts are also individually named-exported — see docs/SPEC.md.
 */
export const Table = Object.assign(TableRoot, {
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  displayName: 'Table',
});

export { TableHead, TableBody, TableRow, TableHeaderCell, TableCell };
