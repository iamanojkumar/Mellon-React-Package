import { useId, useRef } from 'react';
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useControllableState } from '../../hooks/useControllableState';
import { useFieldContext } from '../../hooks/useFieldContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { clamp, roundToStep } from '../Slider/Slider';
import styles from './Rating.module.css';

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Number of stars. Defaults to 5. */
  max?: number;
  /** Allows selecting half-star increments (e.g. 3.5) instead of only whole numbers. */
  allowHalf?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  /** Formats the value for `aria-valuetext`. Defaults to "`value` out of `max` stars". */
  formatValue?: (value: number, max: number) => string;
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7-5.4-4.7 7.1-.6z"
        fill="currentColor"
      />
    </svg>
  );
}

function defaultFormatValue(value: number, max: number): string {
  return `${value} out of ${max} stars`;
}

/**
 * A single `role="slider"` spanning `max` star icons — not `max`
 * individually-focusable stars (no roving-tabindex group like
 * `RadioGroup`/`Menu`). Picking a star rating is fundamentally "adjust one
 * numeric value within a range," the same shape `Slider` already covers,
 * just visualized as stars — one tab stop, arrow-key adjustable, matches
 * how most accessible star-rating implementations are actually built.
 *
 * **Interaction model: discrete click, not continuous drag** — the choice
 * `docs/SPEC.md` flagged as needing a decision at the start of this phase.
 * Unlike `Slider`, this doesn't use `usePointerDrag`: sliding a pointer
 * across a star rating while held down isn't an interaction pattern any
 * mainstream rating widget uses (ratings are single deliberate clicks, or
 * arrow-key nudges), so there's no drag-follow — a plain `onClick`
 * computing the clicked star position is simpler and matches actual
 * expected behavior. No hover preview (highlighting stars as the pointer
 * moves before committing a click) — a deliberate scope cut, the same
 * spirit as `DatePicker`'s free-text-parsing punt or `NumberField`'s
 * missing stepper.
 *
 * Each star is rendered twice, stacked — a full outline star underneath,
 * and a filled star clipped to `fillFraction * 100%` width on top — the
 * standard CSS technique for partial-star fills, which naturally handles
 * both whole (`0%`/`100%`) and half-star (`50%`) cases without branching
 * on `allowHalf` in the rendering itself, only in what `step` resolves to.
 */
export function Rating({
  value: valueProp,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf = false,
  disabled,
  invalid,
  id,
  className,
  'aria-label': ariaLabel,
  formatValue = defaultFormatValue,
}: RatingProps) {
  const field = useFieldContext();
  const generatedId = useId();
  const resolvedId = id ?? field?.id ?? generatedId;
  const resolvedInvalid = invalid ?? field?.invalid ?? false;
  const resolvedDisabled = disabled ?? field?.disabled ?? false;
  const step = allowHalf ? 0.5 : 1;

  const [value, setValue] = useControllableState<number>({
    value: valueProp,
    defaultValue,
    onChange,
  });

  const rowRef = useRef<HTMLDivElement>(null);

  function valueFromPointer(clientX: number): number {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    return clamp(roundToStep(ratio * max, 0, step), 0, max);
  }

  function handleClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (resolvedDisabled) return;
    setValue(valueFromPointer(event.clientX));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (resolvedDisabled) return;
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
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault();
    setValue(clamp(next, 0, max));
  }

  return (
    <div
      ref={rowRef}
      role="slider"
      id={resolvedId}
      tabIndex={resolvedDisabled ? -1 : 0}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={formatValue(value, max)}
      aria-disabled={resolvedDisabled || undefined}
      aria-invalid={resolvedInvalid || undefined}
      aria-describedby={field?.describedById}
      aria-label={ariaLabel}
      className={mergeClasses(styles.row, className)}
      data-disabled={resolvedDisabled || undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: max }, (_, index) => {
        const fillFraction = clamp(value - index, 0, 1);
        return (
          <span key={index} className={styles.star}>
            <span className={styles.starOutline}>
              <StarIcon />
            </span>
            <span className={styles.starFillClip} style={{ width: `${fillFraction * 100}%` }}>
              <span className={styles.starFilled}>
                <StarIcon />
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}

Rating.displayName = 'Rating';
