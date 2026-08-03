import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { Table } from '../Table/Table';
import { Caption } from '../Caption/Caption';
import styles from './ChartSurface.module.css';

export type ChartSurfaceType = 'bar' | 'line';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ChartSurfaceOwnProps {
  type?: ChartSurfaceType;
  data: ChartDataPoint[];
  /** What the chart shows, e.g. "Monthly revenue, in USD" — also this chart's real accessible content, via a visually-hidden data table (see below). */
  label: string;
  /** Pixel height of the plotted area. */
  height?: number;
}

export type ChartSurfaceProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> &
  ChartSurfaceOwnProps;

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 100;
const BAR_GAP_RATIO = 0.35;

/**
 * A minimal, dependency-free data-viz surface — bar or line, a single
 * numeric series — distinct from `Table`/`DataGrid`, which render tabular
 * data rather than plot it. No charting library: every other visual shape
 * in this project is hand-rolled inline SVG (the same "no icon library"
 * precedent `AlertVariantIcon` set), and a chart is no different in kind,
 * just more math.
 *
 * The SVG itself is `aria-hidden` — purely a visual rendering, not the
 * accessible content. The real accessible content is a `VisuallyHidden`
 * `Table` listing every `label`/`value` pair, the standard accessible-chart
 * pattern (a screen reader gets the actual data, not just a summary
 * string); axis labels below the plot are likewise `aria-hidden` for the
 * same reason — they'd otherwise double-announce the same values the
 * hidden table already covers.
 */
export const ChartSurface = forwardRef<HTMLDivElement, ChartSurfaceProps>(function ChartSurface(
  { className, type = 'bar', data, label, height = 200, ...rest },
  ref,
) {
  const max = Math.max(0, ...data.map((point) => point.value));
  const count = data.length;

  const barSlots = data.map((point, index) => {
    const slotWidth = VIEWBOX_WIDTH / count;
    const barWidth = slotWidth * (1 - BAR_GAP_RATIO);
    const barHeight = max > 0 ? (point.value / max) * VIEWBOX_HEIGHT : 0;
    return {
      x: index * slotWidth + (slotWidth - barWidth) / 2,
      y: VIEWBOX_HEIGHT - barHeight,
      width: barWidth,
      height: barHeight,
    };
  });

  const linePoints = data.map((point, index) => {
    const x = count > 1 ? (index / (count - 1)) * VIEWBOX_WIDTH : VIEWBOX_WIDTH / 2;
    const y = max > 0 ? VIEWBOX_HEIGHT - (point.value / max) * VIEWBOX_HEIGHT : VIEWBOX_HEIGHT;
    return { x, y };
  });

  return (
    <div ref={ref} className={mergeClasses(styles.surface, className)} {...rest}>
      <div className={styles.plot} style={{ height }}>
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
          className={styles.svg}
        >
          {type === 'bar' &&
            barSlots.map((bar, index) => (
              <rect
                key={data[index]!.label}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                className={styles.bar}
              />
            ))}
          {type === 'line' && (
            <>
              <polyline
                points={linePoints.map((point) => `${point.x},${point.y}`).join(' ')}
                className={styles.line}
              />
              {linePoints.map((point, index) => (
                <circle
                  key={data[index]!.label}
                  cx={point.x}
                  cy={point.y}
                  r={1.5}
                  className={styles.point}
                />
              ))}
            </>
          )}
        </svg>
      </div>
      <div className={styles.axis} aria-hidden="true">
        {data.map((point) => (
          <Caption key={point.label} className={styles.axisLabel}>
            {point.label}
          </Caption>
        ))}
      </div>
      <VisuallyHidden as="div">
        <Table>
          <caption>{label}</caption>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>Label</Table.HeaderCell>
              <Table.HeaderCell>Value</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {data.map((point) => (
              <Table.Row key={point.label}>
                <Table.Cell>{point.label}</Table.Cell>
                <Table.Cell>{point.value}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </VisuallyHidden>
    </div>
  );
});

ChartSurface.displayName = 'ChartSurface';
