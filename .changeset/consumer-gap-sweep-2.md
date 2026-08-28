---
'@mellon-design/react': minor
---

Close four gaps from a consumer app's own gap log.

- **`CanvasShape` gains `editing`/`onTextChange`/`onEditingEnd`** — double-click
  a `shape` block to edit its label in place, the same as `StickyNote`.
  `Canvas`'s `aiRewrite` now wires a "Rewrite with AI" trigger through for
  `shape` too, rendered at the `CanvasBlock` level (a selection-gated overlay,
  opposite corner from `CanvasFillPicker`'s trigger) rather than inside
  `CanvasShape` itself, since a trigger drawn inside a clipped shape
  (`diamond`/`triangle`/`parallelogram`) would clip away with it. Every other
  block kind still has no click-to-edit entry point on the canvas at all, so
  `CanvasBlockOwnProps.aiRewrite`'s doc comment now says so explicitly instead
  of the prop silently no-op-ing for them.
- **`AISuggestionPopover` gains `editablePrompt`/`onSubmit`** — opts out of the
  default "fetch on open" behaviour in favour of an editable textarea
  pre-filled from `editablePrompt`, so the person using the app (not just the
  integrating developer) can steer the AI instruction before it's sent.
  `StickyNote` adopts this behind a new `aiRewriteEditable` flag, off by
  default — an existing `aiRewrite` consumer's behaviour is unchanged.
- **`Sidebar.Item` gains an `actions` slot**, rendered as a sibling of the
  item's own link/button within the same `<li>` rather than nested inside it
  — nesting a real `<button>` inside this item's own `<a>`/`<button>` is
  invalid HTML and breaks click handling (the outer element's click would
  also fire). Same guard `KanbanCard`'s own `actions` slot uses.
- **Fixed: the internal AI-generation fallback prompt's only inline `"create"`
  example hardcoded `kind:"sticky"`**, anchoring every model-generated block
  to that kind regardless of content — a decision point or a start/end state
  came back as a sticky note instead of a differently-shaped flowchart
  element. `buildCanvasPrompt` now illustrates `"create"` with two different
  kinds.

A fifth ask from the same gap log (icon coverage for research/design-tool
categories) lives in `@mellon-design/icons`, a separate package — not
actionable in this repo.
