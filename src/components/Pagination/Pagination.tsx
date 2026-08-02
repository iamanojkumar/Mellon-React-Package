import { useControllableState } from '../../hooks/useControllableState';
import { mergeClasses } from '../../utilities/mergeClasses';
import datePickerStyles from '../DatePicker/DatePicker.module.css';
import styles from './Pagination.module.css';

type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  if (length <= 0) return [];
  return Array.from({ length }, (_, i) => start + i);
}

/**
 * Classic "boundary + sibling + ellipsis" page-range algorithm (the same
 * shape most pagination implementations converge on): always shows
 * `boundaryCount` pages at each edge and `siblingCount` pages either side of
 * the current page, collapsing any gap into a single ellipsis marker rather
 * than listing every page. Pure and exported so `Pagination.test.tsx` can
 * assert on it directly instead of only through rendered button text.
 */
export function getPaginationRange(
  current: number,
  total: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  if (total <= 0) return [];

  const totalSlots = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalSlots >= total) {
    return range(1, total);
  }

  const leftSiblingStart = Math.max(current - siblingCount, boundaryCount + 2);
  const rightSiblingEnd = Math.min(current + siblingCount, total - boundaryCount - 1);

  const showLeftEllipsis = leftSiblingStart > boundaryCount + 2;
  const showRightEllipsis = rightSiblingEnd < total - boundaryCount - 1;

  const items: PaginationItem[] = [...range(1, boundaryCount)];

  if (showLeftEllipsis) {
    items.push('start-ellipsis');
  } else {
    items.push(...range(boundaryCount + 1, leftSiblingStart - 1));
  }

  items.push(...range(leftSiblingStart, rightSiblingEnd));

  if (showRightEllipsis) {
    items.push('end-ellipsis');
  } else {
    items.push(...range(rightSiblingEnd + 1, total - boundaryCount));
  }

  items.push(...range(total - boundaryCount + 1, total));

  return items;
}

export interface PaginationProps {
  /** 1-indexed current page. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  totalPages: number;
  /** How many page numbers to show on each side of the current page. Defaults to `1`. */
  siblingCount?: number;
  /** How many page numbers to always show at the start and end. Defaults to `1`. */
  boundaryCount?: number;
  disabled?: boolean;
  /** Defaults to `'Pagination'`. */
  'aria-label'?: string;
  className?: string;
}

/**
 * `<nav><ul>` of real `<button>`s, current page marked `aria-current="page"`
 * — no roving-tabindex (unlike `ButtonGroup`'s toolbar pattern): each page
 * button is an independent destination, not one composite widget, so every
 * button stays individually reachable by Tab (the same reasoning
 * `Breadcrumb` follows for the same shape of question). Fully data-driven
 * from `totalPages` rather than children-composed, so — like `Calendar`/
 * `LoadingOverlay` — it's a plain function component, not a compound one.
 * Ellipsis markers are `aria-hidden`, non-interactive text, not buttons —
 * there's no defined destination for "jump into this gap" without a
 * separate jump-to-page input, which is out of scope here. The prev/next
 * buttons reuse `DatePicker.module.css`'s self-contained `.navButton` rule
 * directly rather than duplicating it (see docs/SPEC.md's cross-component
 * CSS reuse note).
 */
export function Pagination({
  page,
  defaultPage = 1,
  onPageChange,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
  disabled = false,
  'aria-label': ariaLabel = 'Pagination',
  className,
}: PaginationProps) {
  const [current, setCurrent] = useControllableState<number>({
    value: page,
    defaultValue: defaultPage,
    onChange: onPageChange,
  });

  function goTo(next: number) {
    if (disabled) return;
    const clamped = Math.min(Math.max(next, 1), Math.max(totalPages, 1));
    if (clamped !== current) setCurrent(clamped);
  }

  const items = getPaginationRange(current, totalPages, siblingCount, boundaryCount);

  return (
    <nav aria-label={ariaLabel} className={mergeClasses(styles.pagination, className)}>
      <ul className={styles.list}>
        <li>
          <button
            type="button"
            aria-label="Previous page"
            className={datePickerStyles.navButton}
            disabled={disabled || current <= 1}
            onClick={() => goTo(current - 1)}
          >
            ‹
          </button>
        </li>
        {items.map((item, index) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === current ? 'page' : undefined}
                data-active={item === current || undefined}
                className={styles.pageButton}
                disabled={disabled}
                onClick={() => goTo(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={`${item}-${index}`} className={styles.ellipsis} aria-hidden="true">
              &hellip;
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            className={datePickerStyles.navButton}
            disabled={disabled || current >= totalPages}
            onClick={() => goTo(current + 1)}
          >
            ›
          </button>
        </li>
      </ul>
    </nav>
  );
}

Pagination.displayName = 'Pagination';
