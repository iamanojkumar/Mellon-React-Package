import { useEffect, useRef, useState } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { Slider } from '../Slider/Slider';
import styles from './Video.module.css';

export interface VideoCaptionTrack {
  /** URL of a WebVTT file. */
  src: string;
  /** BCP 47 language tag, e.g. `"en"`. */
  srcLang: string;
  label: string;
  kind?: 'captions' | 'subtitles';
  default?: boolean;
}

export interface VideoProps {
  src: string;
  poster?: string;
  /** WebVTT caption/subtitle tracks. When present, a CC toggle appears in the control bar. */
  captions?: VideoCaptionTrack[];
  /** Defaults to `false`. Autoplay always starts muted (browser policy), regardless of `defaultMuted`. */
  autoPlay?: boolean;
  loop?: boolean;
  defaultMuted?: boolean;
  defaultVolume?: number;
  /** Accessible label for the `<video>` element. Defaults to `'Video player'`. */
  'aria-label'?: string;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path d="M6 4h2.5v12H6zM11.5 4H14v12h-2.5z" fill="currentColor" />
    </svg>
  );
}

export function VolumeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path d="M3 8v4h3l4 4V4L6 8H3z" fill="currentColor" />
      <path
        d="M13 7.5a3 3 0 010 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M15 5.5a6 6 0 010 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function MuteIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path d="M3 8v4h3l4 4V4L6 8H3z" fill="currentColor" />
      <path
        d="M13.5 8l4 4M17.5 8l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FullscreenIcon({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path
        d="M8 4H5a1 1 0 00-1 1v3M12 4h3a1 1 0 011 1v3M8 16H5a1 1 0 01-1-1v-3M12 16h3a1 1 0 001-1v-3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <path
        d="M4 7V5a1 1 0 011-1h2M16 7V5a1 1 0 00-1-1h-2M4 13v2a1 1 0 001 1h2M16 13v2a1 1 0 01-1 1h-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function CaptionsIcon() {
  return (
    <svg viewBox="0 0 20 20" width="1em" height="1em" aria-hidden="true">
      <rect
        x="2.5"
        y="5"
        width="15"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M6 9.5c-1.4 0-1.4 3 0 3M12 9.5c-1.4 0-1.4 3 0 3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const paddedSecs = String(secs).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedSecs}`;
  }
  return `${minutes}:${paddedSecs}`;
}

/**
 * Custom-controls player over a plain `<video>` — the native browser chrome
 * (`controls` attribute) can't be themed with `--ds-*` tokens or reach
 * WCAG's required "explicit pause control" affordance consistently across
 * browsers, so this hand-rolls play/pause, seek, volume, captions, and
 * fullscreen instead, the same "own the chrome, not the media pipeline"
 * split `RichTextEditor` draws around `execCommand`. Seek and volume reuse
 * `Slider` directly rather than a hand-rolled thumb, per this repo's
 * "thin wrapper" precedent — it's the same controlled-number-with-a-track
 * shape either way. All media-element state (`currentTime`, `duration`,
 * `volume`, `muted`, `paused`) is read back off the element's own DOM
 * events rather than tracked independently, so a browser-level gesture
 * (media-key play/pause, OS volume change) can't desync the UI from the
 * element's real state.
 *
 * `video.play()` returns a promise that browsers (and jsdom, which stubs
 * it as an immediate rejection) can reject — always swallowed, the same
 * defensive `.catch()` every real player needs for autoplay-policy
 * rejections, which doubles as the jsdom compatibility shim.
 * `requestFullscreen`/`exitFullscreen` are feature-detected for the same
 * jsdom-doesn't-implement-it reason `usePointerDrag` already documents for
 * `setPointerCapture`.
 */
export function Video({
  src,
  poster,
  captions,
  autoPlay = false,
  loop = false,
  defaultMuted = false,
  defaultVolume = 1,
  'aria-label': ariaLabel = 'Video player',
  className,
  onPlay,
  onPause,
  onEnded,
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(defaultVolume);
  const [muted, setMuted] = useState(autoPlay ? true : defaultMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptions, setShowCaptions] = useState(
    () => captions?.some((track) => track.default) ?? false,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    video.volume = volume;

    function handleTimeUpdate() {
      if (video) setCurrentTime(video.currentTime);
    }
    function handleLoadedMetadata() {
      if (video && Number.isFinite(video.duration)) setDuration(video.duration);
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
      if (!video) return;
      setVolume(video.volume);
      setMuted(video.muted);
    }

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('durationchange', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('volumechange', handleVolumeChange);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('durationchange', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPlay, onPause, onEnded]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      const playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
    } else {
      video.pause();
    }
  }

  function handleSeek(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  }

  function handleVolumeSlider(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    setVolume(value);
    if (value > 0 && video.muted) {
      video.muted = false;
      setMuted(false);
    }
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function toggleCaptions() {
    const video = videoRef.current;
    if (!video) return;
    const next = !showCaptions;
    setShowCaptions(next);
    for (let i = 0; i < video.textTracks.length; i += 1) {
      const track = video.textTracks[i];
      if (track) track.mode = next ? 'showing' : 'hidden';
    }
  }

  function toggleFullscreen() {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      if (typeof document.exitFullscreen === 'function') {
        document.exitFullscreen().catch(() => {});
      }
    } else if (typeof container.requestFullscreen === 'function') {
      container.requestFullscreen().catch(() => {});
    }
  }

  const hasDuration = duration > 0 && Number.isFinite(duration);

  return (
    <div
      ref={containerRef}
      className={mergeClasses(styles.player, className)}
      data-fullscreen={isFullscreen || undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions are opt-in via the `captions` prop; a consumer's clip may genuinely have no track file (e.g. a silent screen recording), and enforcing one unconditionally isn't feasible for a component wrapping an arbitrary caller-supplied `src` */}
      <video
        ref={videoRef}
        className={styles.video}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        aria-label={ariaLabel}
        onClick={togglePlay}
      >
        {captions?.map((track) => (
          <track
            key={track.src}
            kind={track.kind ?? 'captions'}
            src={track.src}
            srcLang={track.srcLang}
            label={track.label}
            default={track.default}
          />
        ))}
      </video>

      {!isPlaying && (
        <button
          type="button"
          className={styles.bigPlayButton}
          aria-label="Play"
          onClick={togglePlay}
        >
          <PlayIcon />
        </button>
      )}

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

        <span className={styles.time}>{formatTime(currentTime)}</span>

        <Slider
          aria-label="Seek"
          className={styles.seekSlider}
          min={0}
          max={hasDuration ? duration : 0}
          step={0.1}
          value={Math.min(currentTime, hasDuration ? duration : 0)}
          onChange={handleSeek}
          disabled={!hasDuration}
          formatValue={formatTime}
        />

        <span className={styles.time}>{formatTime(duration)}</span>

        {captions && captions.length > 0 && (
          <button
            type="button"
            className={styles.controlButton}
            aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
            aria-pressed={showCaptions}
            onClick={toggleCaptions}
          >
            <CaptionsIcon />
          </button>
        )}

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

        <button
          type="button"
          className={styles.controlButton}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-pressed={isFullscreen}
          onClick={toggleFullscreen}
        >
          <FullscreenIcon active={isFullscreen} />
        </button>
      </div>
    </div>
  );
}

Video.displayName = 'Video';
