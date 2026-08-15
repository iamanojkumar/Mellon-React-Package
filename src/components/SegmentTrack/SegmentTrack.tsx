import { useEffect, useRef, useState } from 'react';
import type {
  FocusEvent,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import type { UsePointerDragHandlers } from '../../hooks/usePointerDrag';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { clamp } from '../Slider/Slider';
import { formatTime } from '../Video/Video';
import { AlertVariantIcon } from '../Alert/Alert';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './SegmentTrack.module.css';

export type SegmentTrackSegmentState =
  'candidate' | 'excluded' | 'selected' | 'accepted' | 'rejected';

export interface SegmentTrackSegment {
  id: string;
  /** Seconds from the start of the track. */
  start: number;
  /** Seconds from the start of the track. Must be `>= start`. */
  end: number;
  state: SegmentTrackSegmentState;
  /** `0`-`1`. Shown in the hover tooltip and the segment's accessible name when present. */
  confidence?: number;
}

export interface SegmentTrackTrimRange {
  start: number;
  end: number;
}

export interface SegmentTrackProps {
  /** Full track length in seconds — segment positions and the playhead are proportional to this. */
  duration: number;
  /** Seconds. Renders the playhead marker; omit to hide it. */
  currentTime?: number;
  /**
   * Pre-computed amplitude peaks (`0`-`1` each) rendered as background bars,
   * purely decorative context. This component does no audio decoding — see
   * `Audio`'s `computePeaks`/`decodeAudioPeaks` for that; hand this the same
   * shape of data. Omit for a plain track.
   */
  waveform?: readonly number[];
  segments: readonly SegmentTrackSegment[];
  /** The id of the segment currently loaded in the review panel. Also drives which segment holds the roving keyboard tab stop. */
  selectedId?: string;
  /** Fires when a segment is clicked or arrow-key-navigated to. Selecting *and* seeking to `start` is the caller's job (e.g. via a `Video`/`Audio` ref) — this only reports which id was chosen. */
  onSegmentClick?: (id: string) => void;
  /** Fires when the empty track (not a segment) is clicked or dragged. */
  onSeek?: (time: number) => void;
  /**
   * Shows draggable "Trim start"/"Trim end" handles over the track for
   * selecting one continuous range independent of `segments` — the same
   * affordance `Audio`'s `trimmable` adds over its waveform. Defaults to
   * `false`.
   */
  trimmable?: boolean;
  trimRange?: SegmentTrackTrimRange;
  defaultTrimRange?: SegmentTrackTrimRange;
  /**
   * Fires as the trim handles are dragged/nudged. Reporting only — this
   * component has no media element of its own, so constraining playback to
   * `{ start, end }` is the caller's job (e.g. `Audio`'s own `trimmable`
   * + `playTrimmedOnly`, or manually pausing a `Video`/`Audio` ref's
   * `onTimeUpdate` once it passes `end`), the same boundary `Audio`'s own
   * `onTrimChange` already draws around re-encoding.
   */
  onTrimChange?: (range: SegmentTrackTrimRange) => void;
  /** Seconds nudged per arrow-key press on a trim handle. Defaults to `0.1`. */
  trimStep?: number;
  /** Accessible label for the track's `listbox` role. Defaults to `'Segments'`. */
  'aria-label'?: string;
  className?: string;
}

const STATE_LABELS: Record<SegmentTrackSegmentState, string> = {
  candidate: 'Candidate',
  excluded: 'Excluded',
  selected: 'Selected',
  accepted: 'Accepted',
  rejected: 'Rejected',
};

/**
 * Only `accepted`/`rejected` make a semantic success/danger claim — see
 * CLAUDE.md's "Status color is never the sole carrier of meaning". `candidate`/
 * `excluded`/`selected` are structural/presentational (unreviewed, discarded,
 * currently-loaded), not a status verdict, so they get no icon.
 */
const STATUS_ICON_VARIANT: Partial<Record<SegmentTrackSegmentState, 'success' | 'danger'>> = {
  accepted: 'success',
  rejected: 'danger',
};

function formatRange(segment: SegmentTrackSegment): string {
  return `${formatTime(segment.start)}–${formatTime(segment.end)}`;
}

function buildSegmentLabel(segment: SegmentTrackSegment): string {
  const confidence =
    segment.confidence !== undefined ? `, ${Math.round(segment.confidence * 100)}% confidence` : '';
  return `${STATE_LABELS[segment.state]} segment, ${formatRange(segment)}${confidence}`;
}

function buildTooltipContent(segment: SegmentTrackSegment): ReactNode {
  if (segment.confidence === undefined) return formatRange(segment);
  return `${formatRange(segment)} · ${Math.round(segment.confidence * 100)}% confidence`;
}

function stopPropagation(event: ReactPointerEvent) {
  event.stopPropagation();
}

/**
 * Stops a handle's own `onPointerDown` from bubbling to the track's
 * click-to-seek handler for the same gesture — the same `isolate()`
 * precedent `Audio`'s trim/seek thumbs already established.
 */
function isolate(handlers: UsePointerDragHandlers): UsePointerDragHandlers {
  return {
    ...handlers,
    onPointerDown: (event) => {
      event.stopPropagation();
      handlers.onPointerDown(event);
    },
  };
}

/**
 * A horizontal, duration-scaled track of disjoint regions doubling as a
 * review queue: the caller drives every state transition (accept/reject/
 * select) by re-rendering `segments` with updated `state` values — this
 * component never mutates that array itself, the same "component stays dumb,
 * consumer owns the decision" split `FileUpload`/`DataGrid` already draw.
 *
 * Not `Timeline` (that's an event log — dot + title per item, not a
 * duration-proportional axis) and not a `RangeSlider` composition (this is
 * N independently-labelled, non-adjustable regions with per-region state,
 * not one draggable min/max pair). Drag-to-resize a segment's boundaries is
 * deliberately out of scope for v1.
 *
 * Segments render in `start` order regardless of array order, both for
 * layout and so arrow-key navigation moves left-to-right along the timeline.
 * Reuses `Slider`'s `clamp`, `Video`'s `formatTime`, and the click-to-seek-
 * via-`usePointerDrag` shape `Audio`'s waveform track already established;
 * a segment's own `onPointerDown` stops propagation (same `isolate()`
 * precedent as `Audio`'s thumbs) so pressing a segment doesn't also fire the
 * track's seek handler for the same gesture.
 *
 * `trimmable` adds a second, independent affordance — one continuous
 * `trimRange`, dragged/nudged via two `role="slider"` handles, same
 * cross-clamped closer-edge-wins shape `Audio`'s own trim handles use. It
 * coexists with `segments`: a track can carry both a reviewed-segment queue
 * and a trim selection at once. Trim state is reporting-only — this
 * component has no media element to constrain playback on, so "playback
 * constrained to the selection" is the caller's job (see `onTrimChange`).
 */
export function SegmentTrack({
  duration,
  currentTime,
  waveform,
  segments,
  selectedId,
  onSegmentClick,
  onSeek,
  trimmable = false,
  trimRange: trimRangeProp,
  defaultTrimRange,
  onTrimChange,
  trimStep = 0.1,
  'aria-label': ariaLabel = 'Segments',
  className,
}: SegmentTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hasDuration = duration > 0 && Number.isFinite(duration);
  const sortedSegments = [...segments].sort((a, b) => a.start - b.start);

  const [focusedId, setFocusedId] = useState<string | null>(
    selectedId ?? sortedSegments[0]?.id ?? null,
  );

  const [trimRange, setTrimRange] = useControllableState<SegmentTrackTrimRange>({
    value: trimRangeProp,
    defaultValue: defaultTrimRange ?? { start: 0, end: duration },
    onChange: onTrimChange,
  });

  useEffect(() => {
    if (selectedId !== undefined) setFocusedId(selectedId);
  }, [selectedId]);

  function timeFromClientX(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || !hasDuration) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  }

  const { handlers: trackHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragStart: (event) => onSeek?.(timeFromClientX(event.clientX)),
    onDragMove: (event) => onSeek?.(timeFromClientX(event.clientX)),
  });

  function updateTrim(which: 'start' | 'end', rawTime: number) {
    const clamped = clamp(rawTime, 0, duration);
    const next: SegmentTrackTrimRange =
      which === 'start'
        ? { start: Math.min(clamped, trimRange.end), end: trimRange.end }
        : { start: trimRange.start, end: Math.max(clamped, trimRange.start) };
    setTrimRange(next);
  }

  const { handlers: startHandleHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragMove: (event) => updateTrim('start', timeFromClientX(event.clientX)),
  });

  const { handlers: endHandleHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragMove: (event) => updateTrim('end', timeFromClientX(event.clientX)),
  });

  function handleTrimKeyDown(which: 'start' | 'end') {
    return (event: KeyboardEvent<HTMLDivElement>) => {
      if (!hasDuration) return;
      const bigStep = trimStep * 10;
      const current = which === 'start' ? trimRange.start : trimRange.end;
      let next: number;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = current + trimStep;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          next = current - trimStep;
          break;
        case 'PageUp':
          next = current + bigStep;
          break;
        case 'PageDown':
          next = current - bigStep;
          break;
        case 'Home':
          next = which === 'start' ? 0 : trimRange.start;
          break;
        case 'End':
          next = which === 'start' ? trimRange.end : duration;
          break;
        default:
          return;
      }
      event.preventDefault();
      // Stops the roving-focus container's own `onKeyDown` (which queries
      // `[data-segment-id]` siblings) from also seeing this ArrowLeft/Right —
      // a trim handle isn't a segment option, and letting it bubble would
      // jump keyboard focus to the first segment on every nudge.
      event.stopPropagation();
      updateTrim(which, next);
    };
  }

  const handleRovingKeyDown = useRovingFocus({
    itemSelector: '[data-segment-id]',
    orientation: 'horizontal',
    wrap: false,
    onNavigate: (item) => {
      const id = item.getAttribute('data-segment-id');
      if (!id) return;
      setFocusedId(id);
      onSegmentClick?.(id);
    },
  });

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    const id = event.target.getAttribute('data-segment-id');
    if (id) setFocusedId(id);
  }

  const playheadPercent =
    hasDuration && currentTime !== undefined ? clamp(currentTime / duration, 0, 1) * 100 : null;
  const trimStartPercent = hasDuration ? clamp(trimRange.start / duration, 0, 1) * 100 : 0;
  const trimEndPercent = hasDuration ? clamp(trimRange.end / duration, 0, 1) * 100 : 100;

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <div ref={trackRef} className={styles.track} {...trackHandlers}>
        {waveform && waveform.length > 0 && (
          <div className={styles.waveform} aria-hidden="true">
            {waveform.map((peak, index) => (
              <span
                key={index}
                className={styles.waveformBar}
                style={{ height: `${Math.max(peak * 100, 4)}%` }}
              />
            ))}
          </div>
        )}

        {trimmable && hasDuration && (
          <>
            <div
              className={styles.trimDim}
              style={{ left: 0, width: `${trimStartPercent}%` }}
              aria-hidden="true"
            />
            <div
              className={styles.trimDim}
              style={{ left: `${trimEndPercent}%`, width: `${100 - trimEndPercent}%` }}
              aria-hidden="true"
            />
          </>
        )}

        {hasDuration && (
          <div
            className={styles.optionsLayer}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            aria-orientation="horizontal"
            onKeyDown={handleRovingKeyDown}
            onFocus={handleFocus}
          >
            {sortedSegments.map((segment) => {
              const left = clamp(segment.start / duration, 0, 1) * 100;
              const width = clamp((segment.end - segment.start) / duration, 0, 1) * 100;
              const iconVariant = STATUS_ICON_VARIANT[segment.state];

              return (
                <Tooltip key={segment.id} content={buildTooltipContent(segment)}>
                  <button
                    type="button"
                    role="option"
                    data-segment-id={segment.id}
                    data-state={segment.state}
                    aria-selected={segment.id === selectedId}
                    aria-label={buildSegmentLabel(segment)}
                    tabIndex={segment.id === focusedId ? 0 : -1}
                    className={styles.segment}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onPointerDown={stopPropagation}
                    onClick={() => onSegmentClick?.(segment.id)}
                  >
                    {iconVariant && (
                      <span
                        className={styles.segmentIcon}
                        data-variant={iconVariant}
                        aria-hidden="true"
                      >
                        <AlertVariantIcon variant={iconVariant} />
                      </span>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>
        )}

        {trimmable && hasDuration && (
          <>
            <div
              role="slider"
              className={styles.trimHandle}
              data-edge="start"
              style={{ left: `${trimStartPercent}%` }}
              tabIndex={0}
              aria-label="Trim start"
              aria-valuemin={0}
              aria-valuemax={trimRange.end}
              aria-valuenow={trimRange.start}
              aria-valuetext={formatTime(trimRange.start)}
              onKeyDown={handleTrimKeyDown('start')}
              {...isolate(startHandleHandlers)}
            />
            <div
              role="slider"
              className={styles.trimHandle}
              data-edge="end"
              style={{ left: `${trimEndPercent}%` }}
              tabIndex={0}
              aria-label="Trim end"
              aria-valuemin={trimRange.start}
              aria-valuemax={duration}
              aria-valuenow={trimRange.end}
              aria-valuetext={formatTime(trimRange.end)}
              onKeyDown={handleTrimKeyDown('end')}
              {...isolate(endHandleHandlers)}
            />
          </>
        )}

        {playheadPercent !== null && (
          <div
            className={styles.playhead}
            style={{ left: `${playheadPercent}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

SegmentTrack.displayName = 'SegmentTrack';
