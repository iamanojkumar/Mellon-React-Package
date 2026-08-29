---
'@mellon-design/react': patch
---

**Fixed — sticky notes and shapes could not be resized at all in `0.11.0`, with no way for a host to restore it.** `isNodeLikeBlockKind` bundled three questions into one predicate, and "is this resizable" was the wrong one to group with the other two: it is right for a `node`, whose size is its label's, and wrong for a sticky note, which is a container for arbitrary prose whose author has every reason to widen it. The grouping also disagreed with the data layer — `applyCanvasCommands` has always honoured `op: 'resize'` for every kind — so a programmatic resize worked while a person couldn't do it by hand.

`node` still refuses resizing by every path. `sticky` and `shape` resize again by pointer and by Alt+arrows, and keep their connection ports and rounded selection highlight. The new `isFixedSizeBlockKind` / `FIXED_SIZE_BLOCK_KINDS` are exported alongside the existing `isNodeLikeBlockKind` / `NODE_LIKE_BLOCK_KINDS`; nothing is removed.

**Their resize zones are invisible, and the cursor is the affordance.** Rather than the eight dots the sized kinds draw, a `sticky`/`shape` gets the same eight zones with nothing painted on them — strips along the edges, squares at the corners — so the block keeps a clean edge until you reach for one, and the pointer changes to `ew-resize`/`ns-resize`/`nwse-resize`/`nesw-resize` where a drag would start. An edge strip is also a bigger target than a 10px dot at its midpoint. Corners sit above the edges so a corner cursor wins where they meet.

Also removed `src/utilities/tolerantJson.ts`, which had no callers and reached `0.11.0` only as a stray `.d.ts` — it was never exported from the package root and never present in `dist/index.js`, so nothing can be importing it.

**Fixed — `image` blocks could not be dragged on the canvas, in any browser.** An `<img>` is natively draggable, so pressing an image block and moving started the browser's own image drag-and-drop; `Canvas` then received a `pointercancel` instead of the `pointermove` sequence its move gesture needs, and the block never travelled. `img` is deliberately absent from `INTERACTIVE_IN_BLOCK`, so the press was always _meant_ to become a block drag — the browser was taking it first. The canvas's `image` face now passes `draggable={false}`.

Set on the canvas face rather than on `Image` itself, so `Image`'s own default is unchanged: a draggable image is a legitimate thing to want elsewhere (dragging a thumbnail into an editor), and only on a canvas does an ancestor already own the press.
