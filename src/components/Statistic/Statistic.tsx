import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Statistic.module.css';

export type StatisticTrend = 'up' | 'down' | 'neutral';

export interface StatisticOwnProps {
  label: ReactNode;
  value: ReactNode;
  trend?: StatisticTrend;
  /** e.g. "+12%" shown next to the trend indicator. */
  trendValue?: ReactNode;
}

export type StatisticProps = Omit<ComponentPropsWithoutRef<'div'>, 'children'> & StatisticOwnProps;

const TREND_SYMBOL: Record<StatisticTrend, string> = {
  up: '▲',
  down: '▼',
  neutral: '●',
};

/** A labeled numeric stat, with an optional trend indicator. Not polymorphic — a fixed label/value/trend structure. */
export const Statistic = forwardRef<HTMLDivElement, StatisticProps>(function Statistic(
  { className, label, value, trend, trendValue, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={mergeClasses(styles.statistic, className)} {...rest}>
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
});

Statistic.displayName = 'Statistic';
