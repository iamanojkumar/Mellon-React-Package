import { forwardRef, useId, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import { Button } from '../Button';
import { Table } from '../Table';
import { VisuallyHidden } from '../VisuallyHidden';
import styles from './ChartContainer.module.css';

export interface ChartDatum {
  label: string;
  value: number;
}

export interface ChartExplainPromptOptions {
  /** The chart's caption. */
  label: string;
  /**
   * The chart's description, but only when it was given as a plain string —
   * it's typed `ReactNode`, and an arbitrary element has no honest text
   * form. Worth including when present, since this is usually where the
   * units live.
   */
  description: string | undefined;
  data: ChartDatum[];
  /** The chart's own value formatter, so the prompt reads in the same units the reader sees. */
  formatValue: (value: number) => string;
}

/**
 * The AI affordance every chart inherits by mounting in `ChartContainer`.
 *
 * Split out as its own interface so `BarChart`/`LineChart`/`ChartSurface`
 * can re-expose it without redeclaring it — they forward these straight
 * through to the container.
 */
export interface ChartAIProps {
  /**
   * Adds an "Explain with AI" trigger beside the caption, opening an
   * `AISuggestionPopover` with a plain-language reading of the series. Off
   * by default, and inert even when `true` unless an ancestor `AIProvider`
   * is mounted — the rendered output is byte-identical to today's whenever
   * this doesn't apply.
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client. Defaults to a trend/extremes/notable-points instruction over the series. */
  buildAIPrompt?: (options: ChartExplainPromptOptions) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

function defaultBuildAIPrompt({
  label,
  description,
  data,
  formatValue,
}: ChartExplainPromptOptions): string {
  const rows = data
    .map((datum) =>
      Number.isFinite(datum.value)
        ? `${datum.label}: ${formatValue(datum.value)}`
        : // Say the reading is missing rather than sending "NaN" — the same
          // reason the plot leaves a gap instead of interpolating one.
          `${datum.label}: no data`,
    )
    .join('\n');

  return [
    `Chart: ${label}`,
    description ? `Note: ${description}` : undefined,
    `Data (category, value):\n${rows}`,
    'Describe the overall trend, the high and low points, and anything notable. Two or three sentences, no preamble.',
  ]
    .filter(Boolean)
    .join('\n\n');
}

export interface ChartContainerOwnProps extends ChartAIProps {
  /**
   * What the chart shows, e.g. "Monthly revenue, in USD". Rendered as the
   * figure's caption and used as the accessible name for both the plot and
   * its table twin — so it is required, not optional.
   */
  label: string;
  /** Longer explanatory text below the caption. */
  description?: ReactNode;
  /**
   * The data behind the plot. Drives the table view, which is every chart's
   * accessibility twin — the SVG itself is `aria-hidden`, so this is what a
   * screen reader actually reads.
   */
  data: ChartDatum[];
  /** Column heading for the label column in the table view. Defaults to "Category". */
  categoryHeading?: string;
  /** Column heading for the value column in the table view. Defaults to "Value". */
  valueHeading?: string;
  /** Formats values in the table view. Defaults to `String`. */
  formatValue?: (value: number) => string;
  /**
   * Renders a visible toggle that swaps the plot for its table. Defaults to
   * `false`, in which case the table is always present but visually hidden —
   * the plot stays the only thing on screen.
   */
  tableToggle?: boolean;
  /** The plot itself — an `<svg>`, which should be `aria-hidden`. */
  children: ReactNode;
}

export type ChartContainerProps = Omit<ComponentPropsWithoutRef<'figure'>, 'children'> &
  ChartContainerOwnProps;

/**
 * The `<figure>` every chart mounts in: caption, optional description, and the
 * chart's accessibility twin as a real `<table>`.
 *
 * The twin is not optional and not a fallback. A chart's SVG is a picture of
 * numbers, so it carries no semantics a screen reader can use; the table *is*
 * the chart's accessible content. `ChartSurface` established this pattern in
 * Phase 25 and it is lifted here so every chart inherits it rather than each
 * re-implementing it.
 */
export const ChartContainer = forwardRef<HTMLElement, ChartContainerProps>(function ChartContainer(
  {
    className,
    label,
    description,
    data,
    categoryHeading = 'Category',
    valueHeading = 'Value',
    formatValue = String,
    tableToggle = false,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    children,
    ...rest
  },
  ref,
) {
  const [showTable, setShowTable] = useState(false);
  const captionId = useId();
  const tableId = useId();

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  // The chart's data is already structured, so the prompt is built from it
  // directly — no scraping the rendered DOM the way `Table` has to.
  const promptOptions: ChartExplainPromptOptions = {
    label,
    description: typeof description === 'string' ? description : undefined,
    data,
    formatValue,
  };
  const explain = () =>
    aiAction.trigger({
      prompt: buildAIPrompt(promptOptions),
      context: { component: 'ChartContainer', label, data },
    });

  const table = (
    <Table aria-labelledby={captionId} id={tableId}>
      <Table.Head>
        <Table.Row>
          <Table.HeaderCell scope="col">{categoryHeading}</Table.HeaderCell>
          <Table.HeaderCell scope="col">{valueHeading}</Table.HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {data.map((datum, index) => (
          <Table.Row key={`${datum.label}-${index}`}>
            <Table.HeaderCell scope="row">{datum.label}</Table.HeaderCell>
            <Table.Cell>{formatValue(datum.value)}</Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  );

  return (
    <figure ref={ref} className={mergeClasses(styles.container, className)} {...rest}>
      <figcaption className={styles.caption} id={captionId}>
        {label}
        {description ? <span className={styles.description}>{description}</span> : null}
      </figcaption>

      {tableToggle || showAI ? (
        <div className={styles.actions}>
          {tableToggle ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-expanded={showTable}
              aria-controls={tableId}
              onClick={() => setShowTable((open) => !open)}
            >
              {showTable ? 'Show chart' : 'Show data table'}
            </Button>
          ) : null}
          {showAI ? (
            <AISuggestionPopover
              triggerLabel={aiExplainLabel}
              status={aiAction.status}
              result={aiAction.result}
              error={aiAction.error}
              // Read-only, like Alert's explanation: there is nothing to
              // accept into — the chart's data comes from the caller.
              onOpenChange={(open) => (open ? explain() : aiAction.reset())}
              onRetry={explain}
            />
          ) : null}
        </div>
      ) : null}

      {tableToggle ? (
        <>
          {/* The plot is hidden rather than unmounted so the toggle doesn't
                throw away chart state (hover, selection) on every flip. */}
          <div className={styles.plot} hidden={showTable}>
            {children}
          </div>
          <div className={styles.table} hidden={!showTable}>
            {table}
          </div>
        </>
      ) : (
        <>
          <div className={styles.plot}>{children}</div>
          <VisuallyHidden className={styles.hiddenTwin}>{table}</VisuallyHidden>
        </>
      )}
    </figure>
  );
});

ChartContainer.displayName = 'ChartContainer';
