---
'@mellon-design/react': minor
---

`Document`: overflowing content now flows onto the next page instead of being clipped, and the grid-view name tag no longer knocks page 1 off the row's baseline. `CanvasPromptBar`/`CanvasChatPanel`/`Canvas` gain a host-supplied `@`-mention source.

**Fixed — `Document` clipped overflow instead of paginating it.** The overflow check had a single caller, the per-page keystroke handler, so content set programmatically (a `pages` prop, a host's own update, an AI writing a long body in one shot) never paginated at all — everything past the first page's height was clipped, with no scrollbar to reveal it. And when typing did trigger it, it appended an _empty_ page and left the overflow clipped in the page above. Pagination now runs from an effect on `pages` — any source — and moves the blocks that don't fit onto the following page, appending one when needed.

Two behaviour changes worth knowing:

- Pagination now runs **whether or not `editable` is set**. A read-only `Document` whose content overflows will now call `onPagesChange`; previously it clipped in silence.
- It still only flows **forward**, and splits **between** top-level blocks, never inside one — a single block taller than a whole page stays put and clips, because it fits nowhere else.
- Following from that: **a page whose HTML is one wrapper element still doesn't paginate.** `<div><h2>…</h2>…</div>` is a single top-level block, and a page's first block is the one thing that never moves — so it clips at page one and looks exactly like the fix not working. Write the blocks as siblings. If you generate `pages` from a model, say so in the prompt and unwrap defensively before writing.

**Fixed — `Document` grid view misaligned every page after the first when `name` was set.** The name tag was attached to page 1's own grid cell, making that cell taller than its siblings by the tag's height. In grid the tag is now a full-width row above the pages; list view is unchanged.

**Added — `references` / `referenceLabel` on `CanvasPromptBar`, `CanvasChatPanel`, and `Canvas`.** Host-owned things that aren't canvas blocks (a page, a document, a record) can be offered in the same `@` menu, and are listed in the submitted prompt under their own heading rather than as `Referenced blocks:`. That separation matters: anything listed as a block is something the model will aim `move`/`update`/`delete` commands at, and every command naming a non-block id comes straight back as a rejection from `applyCanvasCommands`. `buildCanvasPromptWithMentions` takes them as optional third/fourth arguments, so existing two-argument calls emit byte-identical text.

**Fixed — `CanvasPromptBar`'s `minimal` variant could not be made taller than one line of text.** It zeroed the field's padding outright at a specificity (`.input.inputMinimal[data-size]`) no consumer class selector could outrank without `!important` — so the variant intended for a chat composer was the one variant stuck at a toolbar input's height. `minimal` now drops only the _horizontal_ padding (which is what "flush with the host's edge" actually needs); vertical padding comes from the new `size` prop like everywhere else.

**Added — `size` on `CanvasPromptBar`, `promptSize` on `CanvasChatPanel`,** both forwarded to `Input`'s own `size` (`'sm' | 'md' | 'lg'`, default `'md'`). Named `promptSize` on the panel because that component already has dimensions of its own — dragged, resized, clamped to `boundsRef` — and a bare `size` there would read as the panel's.

Note that the floating chat composer is now taller than in `0.10.0` (40px vs ~18px), which is the point of the fix but is a visible change if you were relying on the old height.
