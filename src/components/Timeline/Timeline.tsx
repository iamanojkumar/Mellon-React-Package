import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Timeline.module.css';

export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelineItemColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export interface TimelineRootProps {
  /** Defaults to `'vertical'`. */
  orientation?: TimelineOrientation;
  children: ReactNode;
  className?: string;
}

/**
 * Not polymorphic — a chronological event list is always semantically an
 * ordered list (`<ol>`), same reasoning as `KeyValueList` staying a fixed
 * `<dl>`. Purely presentational: no interaction, no keyboard handling, no
 * focus management, so native list semantics are the entire accessibility
 * story here.
 */
const TimelineRoot = forwardRef<HTMLOListElement, TimelineRootProps>(function Timeline(
  { orientation = 'vertical', children, className },
  ref,
) {
  return (
    <ol
      ref={ref}
      className={mergeClasses(styles.timeline, className)}
      data-orientation={orientation}
    >
      {children}
    </ol>
  );
});

export interface TimelineItemProps {
  /** Timestamp/date label shown above the title. */
  time?: ReactNode;
  title?: ReactNode;
  /** Replaces the default dot marker with custom content (e.g. an inline SVG icon). */
  icon?: ReactNode;
  /** Marker color. Defaults to `'neutral'` — same color vocabulary as `Badge`. */
  color?: TimelineItemColor;
  /** Description/body content shown below the title. */
  children?: ReactNode;
  className?: string;
}

/**
 * A single event: a marker (dot or `icon`) connected to the next item by a
 * line, alongside `time`/`title`/`children` content. The connecting line on
 * the last item is hidden purely in CSS (`:last-child`) — no index tracking
 * needed since `Timeline` has no shared context to track position in.
 */
const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(function TimelineItem(
  { time, title, icon, color = 'neutral', children, className },
  ref,
) {
  return (
    <li ref={ref} className={mergeClasses(styles.item, className)}>
      <span className={styles.markerColumn}>
        <span
          className={styles.marker}
          data-color={color}
          data-has-icon={Boolean(icon) || undefined}
        >
          {icon}
        </span>
        <span className={styles.connector} aria-hidden="true" />
      </span>
      <div className={styles.content}>
        {time !== undefined && <div className={styles.time}>{time}</div>}
        {title !== undefined && <div className={styles.title}>{title}</div>}
        {children !== undefined && <div className={styles.description}>{children}</div>}
      </div>
    </li>
  );
});

TimelineItem.displayName = 'Timeline.Item';

/**
 * Compound component: `<Timeline><Timeline.Item time="..." title="...">...</Timeline.Item></Timeline>`.
 * `Timeline.Item` is also individually named-exported — see docs/SPEC.md
 * for the compound-component convention.
 */
export const Timeline = Object.assign(TimelineRoot, {
  Item: TimelineItem,
  displayName: 'Timeline',
});

export { TimelineItem };
