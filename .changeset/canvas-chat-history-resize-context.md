---
'@mellon-design/react': minor
---

`CanvasChatPanel` keeps the full chat history, is resizable, and takes arbitrary consumer context.

- **Full scrollable history, not just the last turn.** Every `lastMessage`
  that changes to a new value is appended to the chat history alongside the
  prompt that led to it, instead of replacing the single previously-shown
  exchange. A consumer that already has a reply in hand on mount (not just
  one reached through a live `submit`) shows it immediately, same as before.
- **Fixed: the "Thinking" summary's animated dots kept running after the
  reply had already arrived.** They were tied to `thinking` text being
  present, not to actual busy status. The busy indicator is now a separate
  `TypingIndicator`, shown only while a request is actually in flight
  (`status` `'loading'`/`'streaming'`) and gone the instant it settles.
- **Resizable.** Drag the corner handle, or Alt+Arrow (Shift for a bigger
  step) while any focusable part of the panel has focus — the same
  pointer-handle-plus-keyboard-equivalent shape `Canvas`'s own block resize
  handles use. Clamped to `boundsRef` the same way dragging already was.
- **New `context` prop** (and `buildCanvasChatPrompt`'s new third parameter):
  arbitrary extra context folded into every submitted prompt alongside the
  current selection — anything the consuming app wants the model to see that
  isn't canvas block data (app state, the signed-in user, a page's own
  metadata). A plain string rides verbatim; anything else is
  JSON-serialized. `Canvas` gains a matching `chatContext` pass-through prop.
- The panel's drop shadow is lighter (`--ds-elevation-sm`, was `-md`).
