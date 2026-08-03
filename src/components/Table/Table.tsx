import { useRef, useState } from 'react';
import type { ChangeEvent, ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import inputStyles from '../Input/Input.module.css';
import styles from './Table.module.css';

export interface TableOwnProps {
  /**
   * Adds a query field + "Ask with AI" trigger above the table — mirrors
   * `DataGrid`'s `aiTableQuery` at a simpler dataset: since `Table` has no
   * structured `data` prop (it's children-driven, sorting/selection lives
   * in `DataGrid` instead), the prompt is built from the rendered table's
   * own text content rather than `JSON.stringify`d rows. Off by default,
   * and a no-op even when `true` unless an ancestor `AIProvider` is
   * mounted — the rendered output is byte-identical to today's whenever
   * this doesn't apply.
   */
  aiTableQuery?: boolean;
  /** Builds the prompt sent to the AI client from the typed question and the table's extracted text content. Defaults to a generic instruction. */
  buildAIPrompt?: (query: string, tableText: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Ask with AI'`. */
  aiTableQueryLabel?: string;
}

export type TableProps = ComponentPropsWithoutRef<'table'> & TableOwnProps;

function extractTableText(table: HTMLTableElement): string {
  return Array.from(table.querySelectorAll('tr'))
    .map((row) =>
      Array.from(row.querySelectorAll('th, td'))
        .map((cell) => (cell.textContent ?? '').trim())
        .join(' | '),
    )
    .join('\n');
}

function defaultBuildAIPrompt(query: string, tableText: string): string {
  return `Given this table's content:\n${tableText}\n\nAnswer this question about it: ${query}`;
}

function TableRoot({
  className,
  children,
  aiTableQuery = false,
  buildAIPrompt = defaultBuildAIPrompt,
  aiTableQueryLabel = 'Ask with AI',
  ...rest
}: TableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiTableQuery && !!aiClient;
  const [aiQueryText, setAiQueryText] = useState('');

  function buildPrompt() {
    const tableText = tableRef.current ? extractTableText(tableRef.current) : '';
    return buildAIPrompt(aiQueryText, tableText);
  }

  const tableElement = (
    <div className={styles.scrollContainer}>
      <table ref={tableRef} className={mergeClasses(styles.table, className)} {...rest}>
        {children}
      </table>
    </div>
  );

  if (!showAI) return tableElement;

  return (
    <div className={styles.tableWrapper}>
      <div className={styles.aiToolbar}>
        <input
          type="text"
          aria-label="Ask a question about this table"
          placeholder="Ask a question about this table…"
          value={aiQueryText}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setAiQueryText(event.target.value)}
          className={mergeClasses(inputStyles.input, styles.aiToolbarInput)}
        />
        <AISuggestionPopover
          triggerLabel={aiTableQueryLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildPrompt() });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildPrompt() })}
        />
      </div>
      {tableElement}
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
