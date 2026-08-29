/**
 * Where a page's content has to be cut so the remainder can flow onto the
 * following page.
 *
 * Deliberately measurements-in, index-out: jsdom has no layout engine, so
 * anything that reads `getBoundingClientRect` is untestable there (every rect
 * is zero). Keeping the *policy* pure means it can be unit-tested exactly, and
 * only the measuring — a handful of lines in `Document` — is real-browser-only.
 * Same split `canvasGeometry.ts` draws for connector routing.
 */

/**
 * A block whose bottom edge sits within this many pixels of the limit still
 * counts as fitting. Sub-pixel layout rounding, not real overflow — without
 * it a page can paginate against itself forever on a fractional line height.
 */
export const OVERFLOW_TOLERANCE = 1;

/**
 * The index of the first top-level block to move onto the next page, or `-1`
 * when the page's content fits (or when nothing can usefully be moved).
 *
 * `blockBottoms` are the bottom edges of the body's own top-level children, in
 * the same coordinate space as `limit` (viewport pixels, as
 * `getBoundingClientRect` reports them); `limit` is the y-coordinate below
 * which the page clips.
 *
 * Two rules beyond "find the first thing that doesn't fit":
 *
 * - **Block 0 never moves.** A single block taller than the page has nowhere
 *   to go — moving it would push the same block onto page after page forever,
 *   never fitting. It stays and clips, and everything after it still flows.
 *   Splitting *within* a block (mid-paragraph, the way a word processor breaks
 *   a page) would need text-node-level surgery on a `contentEditable` subtree
 *   and is not what this does.
 * - **Nothing moves if there is nothing after the split.** Moving a page's
 *   entire content to a new page leaves the original empty and changes
 *   nothing about what fits.
 *
 * Because content only ever moves *forward*, repeated application terminates.
 */
export function paginationSplitIndex(blockBottoms: readonly number[], limit: number): number {
  const first = blockBottoms.findIndex((bottom) => bottom > limit + OVERFLOW_TOLERANCE);
  if (first === -1) return -1;
  const split = Math.max(first, 1);
  return split < blockBottoms.length ? split : -1;
}
