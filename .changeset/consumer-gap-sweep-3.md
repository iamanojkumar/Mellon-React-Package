---
'@mellon-design/react': patch
---

Close three more gaps from a consumer app's gap log.

- **Fixed: `Sidebar.Item as="button"` centered its label text.** `<button>`
  carries a browser-default `text-align: center` that the item's own CSS
  never reset; every other `as` target (`a`, `div`) has no such default.
  `.item` now sets `text-align: left` explicitly.
- **Fixed: `MessageBubble`'s `user` variant reused `Card`'s
  `--ds-radius-lg`**, which reads as a fully-rounded pill/button on a short
  one-line message (all four corners round into each other when the box is
  short relative to that radius). `.bubble.bubble` now sets its own,
  smaller `border-radius: var(--ds-radius-md)` instead of inheriting
  `Card`'s.
- **Fixed: the internal AI-generation fallback prompt's `"Block kinds:"`
  line never mentioned the `document` kind** (shipped in `0.8.0`), so a
  request that should write into a `document` block's `pages` silently
  degraded to a chat-only answer — the model was never told the kind, or
  its `update` patch shape, existed. `buildCanvasPrompt` now lists
  `document (pages, header?, footer?)` alongside the other kinds and states
  the exact `update` patch shape for it.

A fourth item from the same gap log (a focus/distraction-free viewport for
a canvas-embedded `document` block) turned out to already be shipped and
documented — double-clicking a `document` block already opens its editor
and enters `Canvas`'s own locked focus mode (`F`/`L`/`Escape`); no library
change was needed there, just discoverability on the consumer's side. A
fifth ask (icon coverage for research/design-tool categories) lives in
`@mellon-design/icons`, a separate package — not actionable in this repo.
