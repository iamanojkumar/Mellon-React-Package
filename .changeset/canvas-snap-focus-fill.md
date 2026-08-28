---
'@mellon-design/react': minor
---

Add object snapping, a single-element focus mode, and per-block fill colors to `Canvas`.

- **Snap to objects.** Dragging a block (or a multi-selection, or a frame
  with its members) now magnetically aligns to nearby blocks' edges and
  centers, within a small threshold, and draws a thin alignment guide line
  while it's snapped — `canvasGeometry.ts` gains `snapToObjects` (pure,
  independently testable) plus `rectBounds`, a plain-rect generalization of
  the existing `boundsOf`. Object-snap takes priority over grid-snap per
  axis; grid-snap (the existing `grid` prop) still applies on any axis with
  no nearby match.
- **Focus mode.** Press `F` with a block selected to isolate it: the
  viewport zooms and centers on it, and everything else dims (via layering
  against `--ds-color-surface-overlay`, not per-block opacity — no matching
  opacity token exists to alias). While focused, only that one block
  responds to pointer interaction; press `F` again or `Escape` to exit
  (`Escape` leaves the selection alone). Press `L` to lock focus, freezing
  pan/zoom/scroll entirely (wheel, keyboard, and pointer-pan all no-op)
  while the focused block itself stays fully interactive — drag, resize,
  edit, keyboard-nudge all still work locked. Unlocked, panning and zooming
  away from the focused block is still allowed.
- **New `CanvasFillPicker` component**, and `StickyNote`/`CanvasShape` (plus
  their `CanvasBlockData` kinds) gain `color` — an arbitrary hex fill,
  applied as an inline style, not a design token (the same status as
  `Image.src`: user content, not a hardcoded value). A small trigger shown
  only while a `sticky` or `shape` block is selected opens a popover with
  preset swatches and a full `ColorPicker` for freeform hex — reusing the
  existing `Popover` + `ColorPicker` components rather than a new overlay
  primitive. Layers over `tone`'s existing accent-edge/border-colour styling
  rather than replacing it; there is no contrast guarantee against a colour
  chosen freely.
- `StickyNote`'s padding increased (`--ds-space-sm` → `--ds-space-md`) for
  more breathing room around the note's text.
- No new `circle` block kind — `shape:"ellipse"` with width equal to height
  already renders as one; the AI prompt's shape-kind description now says so
  explicitly, so an AI-driven "draw a circle" request produces a
  correctly-shaped ellipse rather than guessing at a non-existent kind.
