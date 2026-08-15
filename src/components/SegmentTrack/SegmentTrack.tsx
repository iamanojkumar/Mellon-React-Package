import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useRovingFocus } from '../../hooks/useRovingFocus';
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
 */
export function SegmentTrack({
  duration,
  currentTime,
  waveform,
  segments,
  selectedId,
  onSegmentClick,
  onSeek,
  'aria-label': ariaLabel = 'Segments',
  className,
}: SegmentTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const hasDuration = duration > 0 && Number.isFinite(duration);
  const sortedSegments = [...segments].sort((a, b) => a.start - b.start);

  const [focusedId, setFocusedId] = useState<string | null>(
    selectedId ?? sortedSegments[0]?.id ?? null,
  );

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

  return (
    <div className={mergeClasses(styles.wrapper, className)}>
      <div
        ref={trackRef}
        className={styles.track}
        role="listbox"
        tabIndex={-1}
        aria-label={ariaLabel}
        aria-orientation="horizontal"
        onKeyDown={handleRovingKeyDown}
        onFocus={handleFocus}
        {...trackHandlers}
      >
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

        {hasDuration &&
          sortedSegments.map((segment) => {
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
