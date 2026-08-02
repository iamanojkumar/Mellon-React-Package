import { Children, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useControllableState } from '../../hooks/useControllableState';
import { clamp } from '../Slider/Slider';
import { mergeClasses } from '../../utilities/mergeClasses';
import visuallyHiddenStyles from '../VisuallyHidden/VisuallyHidden.module.css';
import styles from './Carousel.module.css';

export interface CarouselProps {
  /** Each child is one slide. */
  children: ReactNode;
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Whether the slideshow starts auto-advancing. Defaults to `false`. Ignored (starts paused) when the user has `prefers-reduced-motion: reduce` set — see this component's own doc comment. */
  autoPlay?: boolean;
  /** Milliseconds between auto-advances. Defaults to `5000`. */
  autoPlayInterval?: number;
  /** Whether Next past the last slide wraps to the first (and Previous past the first wraps to the last). Defaults to `true`. */
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  /** Defaults to `'Carousel'`. */
  'aria-label'?: string;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const SWIPE_THRESHOLD = 50;

/**
 * The W3C APG Carousel pattern: `aria-roledescription="carousel"` region,
 * each slide `role="group" aria-roledescription="slide"` labelled "N of
 * M", a visually-hidden `aria-live="polite"` region announcing the current
 * position on change (screen readers don't reliably announce a
 * programmatic slide change from `aria-label`/`aria-roledescription`
 * alone), and — required by WCAG 2.2.2 ("Pause, Stop, Hide") whenever
 * `autoPlay` is on, not optional — an explicit Play/Pause button, not just
 * hover-to-pause.
 *
 * `autoPlay` starts paused instead of playing when the user has
 * `prefers-reduced-motion: reduce` set, checked once via `matchMedia` at
 * mount — deliberately not the same mechanism `--ds-motion-duration-*`
 * uses (zeroing CSS durations globally under that same media query,
 * `variables.css`), since a zeroed transition still auto-*advances* the
 * slide, just instantly instead of animated; a motion-sensitive user
 * generally wants the auto-advancing to not happen at all, which needs an
 * explicit JS check.
 *
 * Swipe uses `usePointerDrag`'s cumulative delta, read via a ref
 * (`dragDeltaRef`) inside `onDragEnd` rather than the plain state closure —
 * the same stale-value risk `Drawer`'s swipe-to-dismiss hit in Phase 13,
 * fixed the same way here.
 */
export function Carousel({
  children,
  index: indexProp,
  defaultIndex = 0,
  onIndexChange,
  autoPlay = false,
  autoPlayInterval = 5000,
  loop = true,
  showControls = true,
  showIndicators = true,
  'aria-label': ariaLabel = 'Carousel',
  className,
}: CarouselProps) {
  const slides = Children.toArray(children);
  const count = slides.length;

  const [index, setIndex] = useControllableState<number>({
    value: indexProp,
    defaultValue: clamp(defaultIndex, 0, Math.max(count - 1, 0)),
    onChange: onIndexChange,
  });
  const [isPlaying, setIsPlaying] = useState(() => autoPlay && !prefersReducedMotion());
  const [dragOffset, setDragOffset] = useState(0);

  const dragDeltaRef = useRef(0);
  const liveRegionId = useId();

  function goTo(next: number) {
    if (count === 0) return;
    const wrapped = loop ? ((next % count) + count) % count : clamp(next, 0, count - 1);
    setIndex(wrapped);
  }

  useEffect(() => {
    if (!isPlaying || count <= 1) return undefined;
    const id = window.setInterval(() => goTo(index + 1), autoPlayInterval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, autoPlayInterval, index, count, loop]);

  const { isDragging, handlers } = usePointerDrag({
    disabled: count <= 1,
    onDragMove: (_event, delta) => {
      dragDeltaRef.current = delta.x;
      setDragOffset(delta.x);
    },
    onDragEnd: () => {
      const delta = dragDeltaRef.current;
      if (delta > SWIPE_THRESHOLD) goTo(index - 1);
      else if (delta < -SWIPE_THRESHOLD) goTo(index + 1);
      dragDeltaRef.current = 0;
      setDragOffset(0);
    },
  });

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
  }

  const canGoPrev = loop || index > 0;
  const canGoNext = loop || index < count - 1;
  const trackStyle = {
    transform: `translateX(calc(${-index * 100}% + ${dragOffset}px))`,
    transition: isDragging ? 'none' : undefined,
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown only intercepts Arrow keys to move between slides while focus is anywhere inside this region (e.g. a nav button); it adds no interaction semantics to the region itself
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      className={mergeClasses(styles.carousel, className)}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.viewport} {...handlers}>
        <div className={styles.track} style={trackStyle}>
          {slides.map((slide, slideIndex) => (
            <div
              key={slideIndex}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slideIndex + 1} of ${count}`}
              aria-hidden={slideIndex !== index || undefined}
              className={styles.slide}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <span id={liveRegionId} aria-live="polite" className={visuallyHiddenStyles.visuallyHidden}>
        Slide {index + 1} of {count}
      </span>

      {showControls && count > 1 && (
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.navButton}
            aria-label="Previous slide"
            disabled={!canGoPrev}
            onClick={() => goTo(index - 1)}
          >
            ‹
          </button>
          {autoPlay && (
            <button
              type="button"
              className={styles.playButton}
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              aria-pressed={isPlaying}
              onClick={() => setIsPlaying((current) => !current)}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
          )}
          <button
            type="button"
            className={styles.navButton}
            aria-label="Next slide"
            disabled={!canGoNext}
            onClick={() => goTo(index + 1)}
          >
            ›
          </button>
        </div>
      )}

      {showIndicators && count > 1 && (
        <div className={styles.indicators} role="group" aria-label="Slides">
          {slides.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              className={styles.indicator}
              data-active={slideIndex === index || undefined}
              aria-label={`Go to slide ${slideIndex + 1}`}
              aria-current={slideIndex === index || undefined}
              onClick={() => goTo(slideIndex)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

Carousel.displayName = 'Carousel';
