---
'@mellon-design/react': minor
---

Add `Canvas` — an infinite, pannable, zoomable block workspace — with `StickyNote`, `CanvasShape`, `CanvasEmbed`, `CanvasFrame`, `CanvasBlock`, `CanvasConnector`, `CanvasOutline`, plus `useCanvasViewport`, `applyCanvasCommands` and the `canvasGeometry` helpers.

This reopens a documented exclusion. `docs/COMPONENT_LIST.md` listed Canvas/Workspace as out of scope because it needed "a full canvas engine" — true of a `<canvas>` implementation, and not of this one. Blocks are absolutely-positioned **real DOM elements** inside a single transformed world div, so there's no engine: every existing component can be a block, `--ds-*` tokens and all three themes apply for free, and blocks stay focusable and present in the accessibility tree. A raster surface would have cost all four. **Freehand ink stays excluded** and is the one item the original reasoning got right — thousands of points per stroke is genuinely a raster problem.

**Accessibility is the load-bearing design decision.** A canvas conveys meaning through position, which is exactly what a screen reader cannot perceive. So the spatial rendering is `aria-hidden` and `CanvasOutline` **is** the accessible content — the same split the chart track makes between an `aria-hidden` SVG and its table twin. The outline lists blocks in reading order (top-to-bottom, then left-to-right, with a row tolerance so two blocks side by side aren't read as one above the other) and states every connection as text. It is not a convenience view; without it the canvas has no accessible content at all.

Keyboard reaches everything the pointer does: arrows nudge, Shift+arrows step further, **Alt+arrows resize** — so the eight drag handles need no keyboard equivalent and add no tab stops — Enter edits a note, Delete removes, Escape deselects, each announced through a live region.

Every mutation — drag, resize, keyboard, and the AI commands coming in later phases — becomes a `CanvasCommand` through one pure reducer, so no two input paths can disagree about clamping or cascade rules. It validates sequentially and **drops-and-reports** rather than throwing: a `create` followed by a `connect` naming the block it just made both succeed, while a hallucinated id is a reported rejection instead of a corrupted scene. Deleting a block takes its connectors with it; a resize below the minimum is _clamped_ rather than rejected, because a resize drag emits sub-minimum values continuously and rejecting each would stutter instead of stopping.

Connector routing works from the blocks' stored canvas rects, never from measured DOM — which is what makes the whole geometry layer unit-testable despite jsdom having no layout engine, exactly where the bugs live. A connector whose endpoint has gone renders nothing rather than throwing mid-render.

`CanvasEmbed` never uses `dangerouslySetInnerHTML`. Content renders in an iframe with `allow-scripts` but deliberately **without** `allow-same-origin` — granting both is equivalent to no sandbox at all, since the frame could then reach the parent document and strip its own sandbox attribute. There's a test asserting that pairing can't be reintroduced.

Note and shape `tone` is one of the five semantic roles rather than a free colour, and is decoration only — the block's own text carries its meaning. A wider whiteboard palette is blocked on the same Foundation gap as chart series colour, and inventing one here would break the same contract.

Known limits, stated rather than discovered later: DOM blocks degrade past roughly 500 on screen (viewport culling is supported by the coordinate model but not built), and this adds to an already-failing `pnpm size` budget.
