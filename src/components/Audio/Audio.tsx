import { forwardRef, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import type { UsePointerDragHandlers } from '../../hooks/usePointerDrag';
import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import { clamp } from '../Slider/Slider';
import { Slider } from '../Slider/Slider';
import { PlayIcon, PauseIcon, VolumeIcon, MuteIcon, formatTime } from '../Video/Video';
import styles from './Audio.module.css';

export interface AudioTrimRange {
  start: number;
  end: number;
}

export interface AudioProps {
  src: string;
  /** Shows draggable trim handles over the waveform. Defaults to `false`. */
  trimmable?: boolean;
  trimRange?: AudioTrimRange;
  defaultTrimRange?: AudioTrimRange;
  /**
   * Fires as the trim handles are dragged/nudged. This is reporting only —
   * the library never re-encodes audio; producing the actual trimmed file
   * from `{ start, end }` is the consumer's job (same boundary `AIClient`
   * draws around completions).
   */
  onTrimChange?: (range: AudioTrimRange) => void;
  /** When `trimmable`, constrains playback to the `[start, end]` window instead of the full clip. Defaults to `false`. */
  playTrimmedOnly?: boolean;
  /** Seconds nudged per arrow-key press on a trim handle. Defaults to `0.1`. */
  trimStep?: number;
  loop?: boolean;
  defaultVolume?: number;
  /** Number of amplitude bars to render. Defaults to `96`. */
  waveformBars?: number;
  /** Accessible label for the `<audio>` element. Defaults to `'Audio player'`. */
  'aria-label'?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  /**
   * Fires on every native `timeupdate`. For a one-off imperative read or
   * to tap the element into a Web Audio graph (e.g.
   * `AudioContext.createMediaElementSource`), prefer the forwarded `ref`
   * instead — it's the real `HTMLAudioElement`.
   */
  onTimeUpdate?: (currentTime: number) => void;
}

/**
 * Downsamples one or more channels of raw PCM samples to `bucketCount` peak
 * (max-abs-amplitude) values in `[0, 1]`, for rendering as waveform bars.
 * Pure and DOM-free on purpose — the only part of waveform generation that
 * can be unit-tested in jsdom, since `AudioContext.decodeAudioData` itself
 * is a real-browser-only API (see `decodeAudioPeaks` below).
 */
export function computePeaks(channels: readonly Float32Array[], bucketCount: number): number[] {
  const firstChannel = channels[0];
  if (!firstChannel || bucketCount <= 0 || firstChannel.length === 0) return [];

  const length = firstChannel.length;
  const bucketSize = length / bucketCount;
  const peaks: number[] = [];

  for (let bucket = 0; bucket < bucketCount; bucket += 1) {
    const start = Math.floor(bucket * bucketSize);
    const end = bucket === bucketCount - 1 ? length : Math.floor((bucket + 1) * bucketSize);
    let max = 0;
    for (const channel of channels) {
      for (let i = start; i < end && i < channel.length; i += 1) {
        const value = Math.abs(channel[i] ?? 0);
        if (value > max) max = value;
      }
    }
    peaks.push(Math.min(1, max));
  }

  return peaks;
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/**
 * Fetches and decodes `src` into waveform peaks via the Web Audio API.
 * Feature-detected — `AudioContext` doesn't exist in jsdom (same class of
 * real-browser-only gap `usePointerDrag` documents for `setPointerCapture`),
 * so this resolves `null` immediately there rather than throwing, and the
 * caller falls back to flat placeholder bars. A decode failure (unreachable
 * `src`, unsupported codec, CORS) resolves `null` the same way — refusing
 * to invent a waveform is the same rule `LineChart` follows for a missing
 * reading.
 */
async function decodeAudioPeaks(src: string, bucketCount: number): Promise<number[] | null> {
  const AudioContextCtor = getAudioContextCtor();
  if (!AudioContextCtor) return null;
  try {
    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContextCtor();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    void audioContext.close();
    const channels: Float32Array[] = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i += 1) {
      channels.push(audioBuffer.getChannelData(i));
    }
    return computePeaks(channels, bucketCount);
  } catch {
    return null;
  }
}

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
 * Audio clip player. Below the transport controls, the waveform track
 * carries up to three independent `role="slider"` thumbs sharing one
 * pointer-math helper (`timeFromClientX`) — a "Seek" thumb (always
 * present, doubling as the playhead) and, when `trimmable`, "Trim start"/
 * "Trim end" thumbs using the same cross-clamped closer-thumb-wins shape
 * `RangeSlider` already established. Each thumb owns its own
 * `usePointerDrag` instance rather than sharing the track's, and isolates
 * its own `onPointerDown` (`isolate`, above) so grabbing a thumb doesn't
 * also fire the track's click-to-seek handler for the same gesture — a
 * plain click/drag on the bare track still seeks, exactly like `Slider`'s
 * track-is-also-draggable behavior.
 *
 * Trim state only ever reports `{ start, end }` seconds via
 * `onTrimChange` — no audio is re-encoded here (see that prop's doc
 * comment). `playTrimmedOnly` constrains playback to the trimmed window
 * without touching the underlying file at all.
 *
 * Forwards `ref` to the real `HTMLAudioElement` — the standard convention
 * every component here follows, and also what unblocks tapping the
 * element into a Web Audio graph (`AudioContext.createMediaElementSource`
 * needs the actual DOM node, not a number or a synthetic wrapper).
 */
export const Audio = forwardRef<HTMLAudioElement, AudioProps>(function Audio(
  {
    src,
    trimmable = false,
    trimRange: trimRangeProp,
    defaultTrimRange,
    onTrimChange,
    playTrimmedOnly = false,
    trimStep = 0.1,
    loop = false,
    defaultVolume = 1,
    waveformBars = 96,
    'aria-label': ariaLabel = 'Audio player',
    className,
    onPlay,
    onPause,
    onEnded,
    onTimeUpdate,
  }: AudioProps,
  forwardedRef,
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(defaultVolume);
  const [muted, setMuted] = useState(false);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  const [trimRange, setTrimRange] = useControllableState<AudioTrimRange>({
    value: trimRangeProp,
    defaultValue: defaultTrimRange ?? { start: 0, end: 0 },
    onChange: onTrimChange,
  });

  const hasDuration = duration > 0 && Number.isFinite(duration);

  const configRef = useRef({ trimmable, playTrimmedOnly, loop, trimRange });
  useEffect(() => {
    configRef.current = { trimmable, playTrimmedOnly, loop, trimRange };
  });

  useEffect(() => {
    let cancelled = false;
    decodeAudioPeaks(src, waveformBars).then((result) => {
      if (!cancelled) setPeaks(result);
    });
    return () => {
      cancelled = true;
    };
  }, [src, waveformBars]);

  useEffect(() => {
    if (
      trimRangeProp === undefined &&
      hasDuration &&
      trimRange.start === 0 &&
      trimRange.end === 0
    ) {
      setTrimRange({ start: 0, end: duration });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDuration, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = volume;

    function handleLoadedMetadata() {
      if (audio && Number.isFinite(audio.duration)) setDuration(audio.duration);
    }
    function handleTimeUpdate() {
      if (!audio) return;
      const config = configRef.current;
      const time = audio.currentTime;
      if (
        config.trimmable &&
        config.playTrimmedOnly &&
        config.trimRange.end > config.trimRange.start &&
        time >= config.trimRange.end - 0.02
      ) {
        if (config.loop) {
          audio.currentTime = config.trimRange.start;
          setCurrentTime(config.trimRange.start);
          onTimeUpdate?.(config.trimRange.start);
        } else {
          audio.pause();
          audio.currentTime = config.trimRange.end;
          setCurrentTime(config.trimRange.end);
          onTimeUpdate?.(config.trimRange.end);
        }
        return;
      }
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
    function handlePlay() {
      setIsPlaying(true);
      onPlay?.();
    }
    function handlePause() {
      setIsPlaying(false);
      onPause?.();
    }
    function handleEnded() {
      onEnded?.();
    }
    function handleVolumeChange() {
      if (!audio) return;
      setVolume(audio.volume);
      setMuted(audio.muted);
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('volumechange', handleVolumeChange);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('volumechange', handleVolumeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPlay, onPause, onEnded, onTimeUpdate]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) {
      const config = configRef.current;
      if (
        config.trimmable &&
        config.playTrimmedOnly &&
        (audio.currentTime < config.trimRange.start || audio.currentTime >= config.trimRange.end)
      ) {
        audio.currentTime = config.trimRange.start;
        setCurrentTime(config.trimRange.start);
      }
      const playResult = audio.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    } else {
      audio.pause();
    }
  }

  function seekTo(time: number) {
    const audio = audioRef.current;
    if (!audio || !hasDuration) return;
    const clamped = clamp(time, 0, duration);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }

  function timeFromClientX(clientX: number): number {
    const rect = waveformRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || !hasDuration) return 0;
    return clamp((clientX - rect.left) / rect.width, 0, 1) * duration;
  }

  function updateTrim(which: 'start' | 'end', rawTime: number) {
    const clamped = clamp(rawTime, 0, duration);
    const next: AudioTrimRange =
      which === 'start'
        ? { start: Math.min(clamped, trimRange.end), end: trimRange.end }
        : { start: trimRange.start, end: Math.max(clamped, trimRange.start) };
    setTrimRange(next);
  }

  function handleVolumeSlider(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
    if (value > 0 && audio.muted) {
      audio.muted = false;
      setMuted(false);
    }
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  const { handlers: trackHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragStart: (event) => seekTo(timeFromClientX(event.clientX)),
    onDragMove: (event) => seekTo(timeFromClientX(event.clientX)),
  });

  const { handlers: seekThumbHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragStart: (event) => seekTo(timeFromClientX(event.clientX)),
    onDragMove: (event) => seekTo(timeFromClientX(event.clientX)),
  });

  const { handlers: startHandleHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragMove: (event) => updateTrim('start', timeFromClientX(event.clientX)),
  });

  const { handlers: endHandleHandlers } = usePointerDrag({
    disabled: !hasDuration,
    onDragMove: (event) => updateTrim('end', timeFromClientX(event.clientX)),
  });

  function handleSeekKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!hasDuration) return;
    const step = 1;
    const bigStep = 10;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = currentTime + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = currentTime - step;
        break;
      case 'PageUp':
        next = currentTime + bigStep;
        break;
      case 'PageDown':
        next = currentTime - bigStep;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = duration;
        break;
      default:
        return;
    }
    event.preventDefault();
    seekTo(next);
  }

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
      updateTrim(which, next);
    };
  }

  const displayBars = peaks ?? new Array<number>(waveformBars).fill(0.12);
  const seekPercent = hasDuration ? (currentTime / duration) * 100 : 0;
  const startPercent = hasDuration ? (trimRange.start / duration) * 100 : 0;
  const endPercent = hasDuration ? (trimRange.end / duration) * 100 : 100;

  return (
    <div className={mergeClasses(styles.player, className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- audio clips generally have no caption track to attach; this is a clip player, not a captioned-media surface */}
      <audio
        ref={mergeRefs(audioRef, forwardedRef)}
        src={src}
        loop={loop}
        muted={muted}
        aria-label={ariaLabel}
      />

      <div ref={waveformRef} className={styles.waveform} {...trackHandlers}>
        <div className={styles.bars} aria-hidden="true">
          {displayBars.map((peak, index) => (
            <span
              key={index}
              className={styles.bar}
              style={{ height: `${Math.max(peak * 100, 8)}%` }}
            />
          ))}
        </div>

        {trimmable && hasDuration && (
          <>
            <div className={styles.trimDim} style={{ left: 0, width: `${startPercent}%` }} />
            <div
              className={styles.trimDim}
              style={{ left: `${endPercent}%`, width: `${100 - endPercent}%` }}
            />
          </>
        )}

        {hasDuration && (
          <div
            role="slider"
            className={styles.seekThumb}
            style={{ left: `${seekPercent}%` }}
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
            aria-valuetext={formatTime(currentTime)}
            onKeyDown={handleSeekKeyDown}
            {...isolate(seekThumbHandlers)}
          />
        )}

        {trimmable && hasDuration && (
          <>
            <div
              role="slider"
              className={styles.trimHandle}
              data-edge="start"
              style={{ left: `${startPercent}%` }}
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
              style={{ left: `${endPercent}%` }}
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
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.controlButton}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          onClick={togglePlay}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className={styles.time}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          type="button"
          className={styles.controlButton}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
          onClick={toggleMute}
        >
          {muted || volume === 0 ? <MuteIcon /> : <VolumeIcon />}
        </button>

        <Slider
          aria-label="Volume"
          className={styles.volumeSlider}
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={handleVolumeSlider}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
      </div>
    </div>
  );
});

Audio.displayName = 'Audio';
