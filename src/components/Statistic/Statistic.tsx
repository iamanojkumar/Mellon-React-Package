import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Statistic.module.css';

export type StatisticTrend = 'up' | 'down' | 'neutral';

export interface StatisticBuildAIPromptProps {
  label: ReactNode;
  value: ReactNode;
  trend?: StatisticTrend;
  trendValue?: ReactNode;
}

export interface StatisticOwnProps {
  label: ReactNode;
  value: ReactNode;
  trend?: StatisticTrend;
  /** e.g. "+12%" shown next to the trend indicator. */
  trendValue?: ReactNode;
  /**
   * Adds an AI-powered "Explain with AI" trigger next to the stat —
   * explains why the metric changed. Off by default, and a no-op even
   * when `true` unless an ancestor `AIProvider` is mounted — the rendered
   * output is byte-identical to today's whenever this doesn't apply.
   * Read-only: no accept/reject, since an explanation isn't something to
   * replace the stat's own value with (same shape as `Alert`'s
   * `aiExplain`).
   */
  aiExplain?: boolean;
  /** Builds the prompt sent to the AI client from the stat's label/value/trend. Defaults to a generic "explain this change" instruction. */
  buildAIPrompt?: (props: StatisticBuildAIPromptProps) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Explain with AI'`. */
  aiExplainLabel?: string;
}

export type StatisticProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & StatisticOwnProps;

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

function defaultBuildAIPrompt({
  label,
  value,
  trend,
  trendValue,
}: StatisticBuildAIPromptProps): string {
  const lines = [`Metric: ${nodeToText(label)}`, `Current value: ${nodeToText(value)}`];
  if (trend) lines.push(`Trend: ${trend}${trendValue ? ` (${nodeToText(trendValue)})` : ''}`);
  lines.push('Explain what likely caused this change.');
  return lines.join('\n');
}

const TREND_SYMBOL: Record<StatisticTrend, string> = {
  up: '▲',
  down: '▼',
  neutral: '●',
};

/** A labeled numeric stat, with an optional trend indicator. Not polymorphic — a fixed label/value/trend structure. */
export const Statistic = forwardRef<HTMLDivElement, StatisticProps>(function Statistic(
  {
    className,
    label,
    value,
    trend,
    trendValue,
    aiExplain = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiExplainLabel = 'Explain with AI',
    ...rest
  },
  ref,
) {
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiExplain && !!aiClient;

  const statisticElement = (
    <div ref={ref} className={mergeClasses(styles.statistic, !showAI && className)} {...rest}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={styles.trend} data-trend={trend}>
          <span aria-hidden="true">{TREND_SYMBOL[trend]}</span>
          {trendValue}
        </div>
      )}
    </div>
  );

  if (!showAI) return statisticElement;

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {statisticElement}
      <div className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiExplainLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt({ label, value, trend, trendValue }) });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() =>
            aiAction.trigger({ prompt: buildAIPrompt({ label, value, trend, trendValue }) })
          }
        />
      </div>
    </div>
  );
});

Statistic.displayName = 'Statistic';
