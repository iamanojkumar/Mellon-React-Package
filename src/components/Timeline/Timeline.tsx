import { forwardRef, isValidElement } from 'react';
import type { ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { flattenChildren } from '../../utilities/flattenChildren';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './Timeline.module.css';

export type TimelineOrientation = 'vertical' | 'horizontal';
export type TimelineItemColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

function nodeToText(node: ReactNode): string {
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}

function defaultBuildAIPrompt(children: ReactNode): string {
  const entries = flattenChildren(children)
    .filter(isValidElement)
    .map((child) => {
      const props = child.props as TimelineItemProps;
      const time = nodeToText(props.time);
      const title = nodeToText(props.title);
      const description = nodeToText(props.children);
      return [time, title, description].filter(Boolean).join(' — ');
    })
    .filter(Boolean);
  return `Summarize the following sequence of events:\n\n${entries.join('\n')}`;
}

export interface TimelineRootProps {
  /** Defaults to `'vertical'`. */
  orientation?: TimelineOrientation;
  children: ReactNode;
  className?: string;
  /**
   * Adds an AI-powered "Summarize with AI" trigger next to the timeline —
   * summarizes the whole history/sequence of events. Off by default, and
   * a no-op even when `true` unless an ancestor `AIProvider` is mounted —
   * the rendered output is byte-identical to today's whenever this
   * doesn't apply. Read-only: no accept/reject, since a summary isn't
   * something to replace the timeline's own content with (same shape as
   * `Alert`'s `aiExplain`). Only string/number `time`/`title`/`children`
   * on each `Timeline.Item` contribute to the default prompt.
   */
  aiSummarize?: boolean;
  /** Builds the prompt sent to the AI client from the timeline's items. Defaults to serializing each item's time/title/description. */
  buildAIPrompt?: (children: ReactNode) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Summarize with AI'`. */
  aiSummarizeLabel?: string;
}

/**
 * Not polymorphic — a chronological event list is always semantically an
 * ordered list (`<ol>`), same reasoning as `KeyValueList` staying a fixed
 * `<dl>`. Purely presentational: no interaction, no keyboard handling, no
 * focus management, so native list semantics are the entire accessibility
 * story here.
 */
const TimelineRoot = forwardRef<HTMLOListElement, TimelineRootProps>(function Timeline(
  {
    orientation = 'vertical',
    children,
    className,
    aiSummarize = false,
    buildAIPrompt = defaultBuildAIPrompt,
    aiSummarizeLabel = 'Summarize with AI',
  },
  ref,
) {
  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiSummarize && !!aiClient;

  const listElement = (
    <ol
      ref={ref}
      className={mergeClasses(styles.timeline, !showAI && className)}
      data-orientation={orientation}
    >
      {children}
    </ol>
  );

  if (!showAI) return listElement;

  return (
    <div className={mergeClasses(styles.aiWrapper, className)}>
      {listElement}
      <div className={styles.aiTrigger}>
        <AISuggestionPopover
          triggerLabel={aiSummarizeLabel}
          status={aiAction.status}
          result={aiAction.result}
          error={aiAction.error}
          onOpenChange={(open) => {
            if (open) {
              aiAction.trigger({ prompt: buildAIPrompt(children) });
            } else {
              aiAction.reset();
            }
          }}
          onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(children) })}
        />
      </div>
    </div>
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
