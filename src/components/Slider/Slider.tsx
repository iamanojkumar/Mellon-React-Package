import { useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Slider.module.css';

export type SliderSize = 'sm' | 'md' | 'lg';
export type SliderOrientation = 'horizontal' | 'vertical';
/**
 * `'always'` shows the value bubble permanently; `'drag'` shows it only
 * while actively interacting with the thumb (dragging *or* keyboard-
 * focused — not drag alone, so keyboard users get the same feedback
 * mouse/touch users do); `'off'` (default) never shows it, preserving
 * existing consumers' exact prior appearance.
 */
export type SliderValueDisplay = 'always' | 'drag' | 'off';

export interface SliderProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  orientation?: SliderOrientation;
  size?: SliderSize;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  /** Formats the value for `aria-valuetext` and the value bubble (see `showValue`). Omit to let both display the raw number. */
  formatValue?: (value: number) => string;
  /** Controls when the current-value bubble is shown. Defaults to `'off'`. */
  showValue?: SliderValueDisplay;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToStep(value: number, min: number, step: number): number {
  return min + Math.round((value - min) / step) * step;
}

export interface SliderValueBubbleProps {
  children: ReactNode;
  orientation: SliderOrientation;
}

/**
 * The `showValue` bubble's markup/positioning, factored out so
 * `RangeSlider` (which needs one per thumb) doesn't duplicate it. Rendered
 * as a child of the (already `position: absolute`) `.thumb` element, so
 * its own `position: absolute` resolves relative to the thumb's box —
 * no separate positioning math needed.
 */
export function SliderValueBubble({ children, orientation }: SliderValueBubbleProps) {
  return (
    <span className={styles.valueBubble} data-orientation={orientation} aria-hidden="true">
      {children}
    </span>
  );
}

/**
 * A real `role="slider"` widget (not a native `<input type="range">`) — a
 * native range input can't be styled into `RangeSlider`'s two-thumb shape
 * at all, so both share one hand-rolled implementation rather than one
 * being native and the other custom. `usePointerDrag`'s `handlers` are
 * spread on the *track*, not just the thumb, so pointerdown anywhere on it
 * both jumps the value to that point and starts a drag (a real thumb-grab
 * still works — the thumb is a child of the track, so its own pointerdown
 * bubbles up to the same handler). Position is recomputed fresh from
 * `getBoundingClientRect()` on every move rather than cached at drag
 * start, so a mid-drag resize/layout shift can't desync the thumb from
 * the pointer. No `required` prop: `aria-required` isn't a supported
 * attribute on `role="slider"` (unlike `role="combobox"`/`"textbox"`),
 * the same reasoning `DatePicker` already documented for its own
 * `role="button"` trigger — an ancestor `Field`'s `required` still shows
 * its own label asterisk regardless.
 */
export function Slider({
  value: valueProp,
  defaultValue = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  orientation = 'horizontal',
  size = 'md',
  disabled,
  invalid,
  id,
  className,
  'aria-label': ariaLabel,
  formatValue,
  showValue = 'off',
}: SliderProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;

  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const [isFocused, setIsFocused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  function valueFromPointer(clientX: number, clientY: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return value;
    const ratio =
      orientation === 'horizontal'
        ? (clientX - rect.left) / rect.width
        : 1 - (clientY - rect.top) / rect.height;
    const raw = min + clamp(ratio, 0, 1) * (max - min);
    return clamp(roundToStep(raw, min, step), min, max);
  }

  const { isDragging, handlers } = usePointerDrag({
    disabled: resolvedDisabled,
    onDragStart: (event) => setValue(valueFromPointer(event.clientX, event.clientY)),
    onDragMove: (event) => setValue(valueFromPointer(event.clientX, event.clientY)),
  });

  const showBubble = showValue === 'always' || (showValue === 'drag' && (isDragging || isFocused));

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (resolvedDisabled) return;
    const bigStep = step * 10;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + step;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - step;
        break;
      case 'PageUp':
        next = value + bigStep;
        break;
      case 'PageDown':
        next = value - bigStep;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    setValue(clamp(next, min, max));
  }

  const percent = ((value - min) / (max - min)) * 100;
  const fillStyle: CSSProperties =
    orientation === 'horizontal' ? { width: `${percent}%` } : { height: `${percent}%` };
  const thumbStyle: CSSProperties =
    orientation === 'horizontal' ? { left: `${percent}%` } : { bottom: `${percent}%` };

  return (
    <div
      className={mergeClasses(styles.wrapper, className)}
      data-orientation={orientation}
      data-disabled={resolvedDisabled || undefined}
    >
      <div
        ref={trackRef}
        className={styles.track}
        data-orientation={orientation}
        data-size={size}
        {...handlers}
      >
        <div className={styles.fill} style={fillStyle} />
        <div
          role="slider"
          id={resolvedId}
          tabIndex={resolvedDisabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue?.(value)}
          aria-orientation={orientation}
          aria-disabled={resolvedDisabled || undefined}
          aria-invalid={resolvedInvalid || undefined}
          aria-describedby={field?.describedById}
          aria-label={ariaLabel}
          className={styles.thumb}
          style={thumbStyle}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {showBubble && (
            <SliderValueBubble orientation={orientation}>
              {formatValue?.(value) ?? value}
            </SliderValueBubble>
          )}
        </div>
      </div>
    </div>
  );
}

Slider.displayName = 'Slider';
