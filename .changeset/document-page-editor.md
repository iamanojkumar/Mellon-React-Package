---
'@mellon-design/react': minor
---

Add `Document`/`DocumentPage` — a simple multi-page note/resume editor — plus a new `document` `Canvas` block kind.

- **New `documentAspectRatio.ts` utility.** `DocumentAspectRatio` is a named
  preset union (`'a4' | '16:9' | '4:3'`) plus a custom `{width, height}`
  escape hatch — the same "preset union + custom override" shape used
  elsewhere, so new presets are additive later without a breaking change.
- **New `DocumentPage` component.** One page's fixed-aspect-ratio surface,
  reusing `Card`'s box rather than duplicating its styling. A compound
  component with optional `Header`/`Body`/`Footer` parts; `Body` takes a
  `layout` (`'single'` default, `'two-column'`, `'sidebar'`), wrapping
  content in `Grid` only for the presets that need one.
- **New `Document` component.** Manages an array of pages (`pages`, one HTML
  string each) controlled/uncontrolled the same way `Canvas`'s `scene` is —
  the seam a future AI/chat component would edit pages through, the same
  `onPagesChange` a person's own typing already goes through, not a parallel
  path. `editable` mounts a `RichTextEditor` per page (read-only static HTML
  otherwise). Works two ways:
  - Standalone (`chrome` true, the default): a list/grid view toggle, zoom
    controls (buttons and Ctrl/Cmd+wheel), and arrow-key page navigation —
    only when focus isn't inside a page's own text surface, so the caret
    keeps working normally while typing.
  - Embedded, `chrome={false}`: just the active page, for a host that
    already owns pan/zoom — currently only `Canvas`.
- **Auto-pagination only ever appends a page** once the last page's content
  outgrows its fixed box — it never re-flows already-typed content backward
  across a page boundary. Deferred via `setTimeout`, not
  `requestAnimationFrame`: rAF never fires at all in a backgrounded/unpainted
  tab, confirmed live, which would silently break auto-pagination for a
  canvas app switched away from mid-paste.
- **New `document` `CanvasBlockData` kind** (`pages`, `aspectRatio`,
  `layout`, `header`, `footer`), rendering `Document` with `chrome={false}`
  inside a canvas block. Double-clicking one opens its editor and enters
  `Canvas`'s own focus mode (from the previous release) **locked by
  default** — the one place in this library where focus doesn't default to
  free-to-look-around, since editing a document's text while the viewport
  can still be panned away from under you is the actual bad experience being
  avoided. Escape exits both the editor and focus together, in one keystroke.
- **Fixed, found while wiring the above: `Canvas`'s keyboard handler
  unconditionally suppressed every key while any block was being edited**,
  which meant Escape could never reach the focus-exit branch for a
  `document` block's editor (a sticky note's own textarea already stops
  Escape from bubbling that far itself, so this never surfaced before).
