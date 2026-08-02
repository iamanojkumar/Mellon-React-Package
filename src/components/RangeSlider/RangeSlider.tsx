import { useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { SliderValueBubble, clamp, roundToStep } from '../Slider/Slider';
import type { SliderOrientation, SliderSize, SliderValueDisplay } from '../Slider/Slider';
import sliderStyles from '../Slider/Slider.module.css';

export type RangeSliderValue = [number, number];

export interface RangeSliderProps {
  value?: RangeSliderValue;
  defaultValue?: RangeSliderValue;
  onChange?: (value: RangeSliderValue) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  size?: SliderSize;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  /** Accessible label for the lower-bound thumb. Defaults to "Minimum". */
  startLabel?: string;
  /** Accessible label for the upper-bound thumb. Defaults to "Maximum". */
  endLabel?: string;
  formatValue?: (value: number) => string;
  /** Controls when each thumb's current-value bubble is shown. Defaults to `'off'`. See `Slider`'s `showValue`. */
  showValue?: SliderValueDisplay;
}

type ActiveThumb = 'start' | 'end';

/**
 * `Slider`'s two-thumb sibling — reuses `Slider.module.css` directly
 * (`.wrapper`/`.track`/`.fill`/`.thumb`) rather than duplicating the
 * track/thumb styling, the same cross-component CSS pattern `MultiSelect`
 * already used on `Select.module.css`. Each thumb is independently
 * focusable/keyboard-adjustable and cross-clamped against the other (the
 * start thumb can't pass the end thumb and vice versa). `usePointerDrag`'s
 * handlers live on the track, same as `Slider`; on pointerdown, whichever
 * thumb is *closer* to the clicked position becomes the one being
 * dragged — decided once per gesture (via a ref, not re-evaluated on every
 * move) so a fast drag that crosses the other thumb's position doesn't
 * cause the active thumb to swap mid-gesture. `showValue` reuses `Slider`'s
 * `SliderValueBubble`, one per thumb — for `'drag'` mode each thumb's
 * bubble tracks *that thumb's own* drag/focus state independently (not
 * "is anything on this control being dragged"), so nudging the start
 * thumb never lights up the end thumb's bubble.
 */
export function RangeSlider({
  value: valueProp,
  defaultValue = [0, 100],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  size = 'md',
  disabled,
  invalid,
  className,
  startLabel = 'Minimum',
  endLabel = 'Maximum',
  formatValue,
  showValue = 'off',
}: RangeSliderProps) {
  const field = useFieldContext();
  const idBase = useId();
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;

  const [value, setValue] = useControllableState<RangeSliderValue>({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const [focusedThumb, setFocusedThumb] = useState<ActiveThumb | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const activeThumbRef = useRef<ActiveThumb | null>(null);

  function valueFromPointer(clientX: number, clientY: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return min;
    const ratio =
      orientation === 'horizontal'
        ? (clientX - rect.left) / rect.width
        : 1 - (clientY - rect.top) / rect.height;
    const raw = min + clamp(ratio, 0, 1) * (max - min);
    return clamp(roundToStep(raw, min, step), min, max);
  }

  function updateThumb(thumb: ActiveThumb, raw: number) {
    const clamped = clamp(roundToStep(raw, min, step), min, max);
    const next: RangeSliderValue =
      thumb === 'start'
        ? [Math.min(clamped, value[1]), value[1]]
        : [value[0], Math.max(clamped, value[0])];
    setValue(next);
  }

  const { isDragging, handlers } = usePointerDrag({
    disabled: resolvedDisabled,
    onDragStart: (event) => {
      const clicked = valueFromPointer(event.clientX, event.clientY);
      const distToStart = Math.abs(clicked - value[0]);
      const distToEnd = Math.abs(clicked - value[1]);
      const thumb: ActiveThumb = distToStart <= distToEnd ? 'start' : 'end';
      activeThumbRef.current = thumb;
      updateThumb(thumb, clicked);
    },
    onDragMove: (event) => {
      if (!activeThumbRef.current) return;
      updateThumb(activeThumbRef.current, valueFromPointer(event.clientX, event.clientY));
    },
    onDragEnd: () => {
      activeThumbRef.current = null;
    },
  });

  function handleThumbKeyDown(thumb: ActiveThumb) {
    return (event: KeyboardEvent<HTMLDivElement>) => {
      if (resolvedDisabled) return;
      const bigStep = step * 10;
      const current = thumb === 'start' ? value[0] : value[1];
      let next: number;
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          next = current + step;
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          next = current - step;
          break;
        case 'PageUp':
          next = current + bigStep;
          break;
        case 'PageDown':
          next = current - bigStep;
          break;
        case 'Home':
          next = thumb === 'start' ? min : value[0];
          break;
        case 'End':
          next = thumb === 'start' ? value[1] : max;
          break;
        default:
          return;
      }
      event.preventDefault();
      updateThumb(thumb, next);
    };
  }

  const startPercent = ((value[0] - min) / (max - min)) * 100;
  const endPercent = ((value[1] - min) / (max - min)) * 100;
  const fillStyle: CSSProperties =
    orientation === 'horizontal'
      ? { left: `${startPercent}%`, width: `${endPercent - startPercent}%` }
      : { bottom: `${startPercent}%`, height: `${endPercent - startPercent}%` };
  const startThumbStyle: CSSProperties =
    orientation === 'horizontal' ? { left: `${startPercent}%` } : { bottom: `${startPercent}%` };
  const endThumbStyle: CSSProperties =
    orientation === 'horizontal' ? { left: `${endPercent}%` } : { bottom: `${endPercent}%` };

  // `activeThumbRef` is a ref, but it's only ever mutated synchronously
  // inside the same `usePointerDrag` handlers that also drive `isDragging`
  // (state) — by the time this render sees `isDragging === true`, the ref
  // already reflects which thumb that drag belongs to.
  function isThumbBubbleVisible(thumb: ActiveThumb): boolean {
    if (showValue === 'always') return true;
    if (showValue !== 'drag') return false;
    return (isDragging && activeThumbRef.current === thumb) || focusedThumb === thumb;
  }

  return (
    <div
      className={mergeClasses(sliderStyles.wrapper, className)}
      data-orientation={orientation}
      data-disabled={resolvedDisabled || undefined}
    >
      <div
        ref={trackRef}
        className={sliderStyles.track}
        data-orientation={orientation}
        data-size={size}
        {...handlers}
      >
        <div className={sliderStyles.fill} style={fillStyle} />
        <div
          role="slider"
          id={`${idBase}-start`}
          tabIndex={resolvedDisabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={value[1]}
          aria-valuenow={value[0]}
          aria-valuetext={formatValue?.(value[0])}
          aria-orientation={orientation}
          aria-disabled={resolvedDisabled || undefined}
          aria-invalid={resolvedInvalid || undefined}
          aria-label={startLabel}
          className={sliderStyles.thumb}
          style={startThumbStyle}
          onKeyDown={handleThumbKeyDown('start')}
          onFocus={() => setFocusedThumb('start')}
          onBlur={() => setFocusedThumb((current) => (current === 'start' ? null : current))}
        >
          {isThumbBubbleVisible('start') && (
            <SliderValueBubble orientation={orientation}>
              {formatValue?.(value[0]) ?? value[0]}
            </SliderValueBubble>
          )}
        </div>
        <div
          role="slider"
          id={`${idBase}-end`}
          tabIndex={resolvedDisabled ? -1 : 0}
          aria-valuemin={value[0]}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          aria-valuetext={formatValue?.(value[1])}
          aria-orientation={orientation}
          aria-disabled={resolvedDisabled || undefined}
          aria-invalid={resolvedInvalid || undefined}
          aria-label={endLabel}
          className={sliderStyles.thumb}
          style={endThumbStyle}
          onKeyDown={handleThumbKeyDown('end')}
          onFocus={() => setFocusedThumb('end')}
          onBlur={() => setFocusedThumb((current) => (current === 'end' ? null : current))}
        >
          {isThumbBubbleVisible('end') && (
            <SliderValueBubble orientation={orientation}>
              {formatValue?.(value[1]) ?? value[1]}
            </SliderValueBubble>
          )}
        </div>
      </div>
    </div>
  );
}

RangeSlider.displayName = 'RangeSlider';
