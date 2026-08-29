---
'@mellon-design/react': patch
---

**Fixed — `Document`'s editing experience: a page was a `24rem` card, its zoom control didn't change text size, and content clipped at the bottom of a sheet.**

**A page is a real sheet now.** Each page is sized at A4's own width (`49.625rem` — 210mm at 96dpi) with a 1in print margin and `--ds-font-size-md` body text, instead of `24rem` with `--ds-font-size-sm` — which is why typing into one read as writing inside a card.

**Zoom is a real length, not a `transform`.** One custom property, `--doc-sheet-scale`, multiplies sheet width, print margin, and text size together, so zooming changes the text size (the thing a transform could do) without changing how much text fits on a page (the thing it couldn't). The `transform: scale()` it replaces was wrong three ways at once:

- A transform takes no part in layout, so zooming in never grew the scroll area — the sides and bottom of the page went somewhere with no scrollbar to reach them. The `align-items: center` under it made the start-edge overflow unreachable even in principle; pages centre with `margin-inline: auto` now.
- Auto-pagination compared `getBoundingClientRect()` (scaled by the transform) against a padding read from `getComputedStyle` (not scaled), so above 100% the clip limit was wrong by the padding times the zoom factor and pages split in the wrong place.
- Grid view shrank the sheet and left full-size text in it, so a thumbnail read as a cropped page rather than a small one. It drives the same scale factor down to `0.32` instead.

**The page states its own prose typography.** `reset.css` zeroes every margin and isn't part of `dist` at all, so paragraph, heading, and list rhythm inside a page could not be inherited from anywhere — paragraphs ran together with no gap. `Document` defines the scale itself, entirely in `em` so it rides `--doc-sheet-scale`, and zeroes the first and last block's outer margins, which land _inside_ the page's print margin rather than collapsing through it and otherwise opened every sheet with a blank line.

**Less chrome above the page.** The formatting toolbar and the view/zoom controls share one row instead of stacking two full-width bars, and a page's header no longer sits a full print margin away from the first line under it — header and body are inside the same margin, so stacking both paddings put a margin's worth of dead space at the top of every sheet. The zoom control also shows its current percentage, which doubles as the reset-to-100% button.

**The whole page body is a click target.** `RichTextEditor` puts `className` on its root, not on its editable surface, whose own `min-height` is a fixed `8em` — so the caret area stopped a fixed distance down a sheet of any height and clicking the blank rest of it did nothing.

`DocumentPage` gains two CSS custom properties, `--doc-page-margin` and `--doc-page-font-size`, defaulted to `--ds-*` tokens — that is the seam `Document` scales through. A `DocumentPage` used on its own is unchanged apart from the header/body seam. An embedded (`chrome={false}`) page reads the same two from container-query units, so it stays in proportion inside whatever box its host gave it, floored so a small `Canvas` block stays legible. No prop was added, removed, or changed.
