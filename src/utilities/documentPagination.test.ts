import { describe, expect, it } from 'vitest';
import { paginationSplitIndex, OVERFLOW_TOLERANCE } from './documentPagination';

describe('paginationSplitIndex', () => {
  it('reports nothing to move when every block fits', () => {
    expect(paginationSplitIndex([20, 40, 60], 100)).toBe(-1);
  });

  it('splits at the first block whose bottom passes the limit', () => {
    expect(paginationSplitIndex([20, 40, 60, 120], 100)).toBe(3);
  });

  it('moves every block from the split onward, not just the offending one', () => {
    // The caller slices from this index — blocks after an overflowing one are
    // below it and therefore also past the limit.
    expect(paginationSplitIndex([20, 110, 180, 240], 100)).toBe(1);
  });

  it('treats a block ending exactly on the limit as fitting', () => {
    expect(paginationSplitIndex([50, 100], 100)).toBe(-1);
  });

  it('absorbs sub-pixel rounding rather than paginating against it', () => {
    expect(paginationSplitIndex([100 + OVERFLOW_TOLERANCE], 100)).toBe(-1);
    expect(paginationSplitIndex([50, 100 + OVERFLOW_TOLERANCE], 100)).toBe(-1);
  });

  // A block taller than the whole page fits nowhere, so moving it would push
  // the same block onto page after page forever without ever resolving.
  it('never moves a page’s first block, so a too-tall block cannot loop', () => {
    expect(paginationSplitIndex([500], 100)).toBe(-1);
  });

  it('still flows the blocks after an unsplittable first one', () => {
    expect(paginationSplitIndex([500, 700], 100)).toBe(1);
  });

  it('reports nothing to move for an empty page', () => {
    expect(paginationSplitIndex([], 100)).toBe(-1);
  });

  // jsdom has no layout engine: every rect is zero. The check has to be a
  // no-op there rather than splitting every page on garbage measurements.
  it('is a no-op when nothing has been laid out', () => {
    expect(paginationSplitIndex([0, 0, 0], 0)).toBe(-1);
  });
});
