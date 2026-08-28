---
'@mellon-design/react': minor
---

Add a floating AI chat panel to `Canvas`.

- **New `CanvasChatPanel` component**, and `Canvas` gains `aiPromptFloating`.
  With `aiPrompt` and `aiPromptFloating` both set, the prompt bar decouples
  from the static row above the surface and floats as a compact draggable
  card over the canvas instead — same `resolveCommands`/`useCanvasCommands`
  pipeline, so it shares the static bar's single in-flight request, outcome
  classification, undo toast, and `CanvasChangePreview` review panel rather
  than owning a parallel one. Styled to a reference mockup: rounded card, a
  bare drag-handle bar, a borderless input (`CanvasPromptBar` gains a
  `variant="minimal"` for it), and the response area's scrollbar hidden.
- **Movable, minimizable, never closable.** Drag it by its header — bounds
  are read once at drag-start rather than on every pointer move, which is
  what made the previous version feel laggy. Minimize by double-clicking the
  header, its hover/focus-revealed icon button, or an opt-in
  `minimizeShortcut` chord (e.g. `'mod+j'` — `'mod'` matches Ctrl or Cmd) the
  host app supplies and picks itself; minimized shows a title bar instead of
  the bare handle. There is no close control — the assistant stays mounted,
  only ever expanded or minimized, and always has control over the canvas
  through the same command pipeline every other AI entry point uses.
- **Shows the exchange, not just the reply.** The last submitted prompt
  renders as a `MessageBubble` above the reply, which itself renders as plain
  text.
- **Selection-aware, including a selected frame's contents.** The canvas's
  current selection — full block data, not just ids — rides along on every
  prompt. Selecting a frame now expands this to the frame's own data _plus_
  every block visually inside it (`canvasGeometry.ts` gains
  `frameMembers`/`withFrameMembers`, computed live from current positions,
  not a stored relationship), and dragging or keyboard-nudging a selected
  frame carries those same blocks along with it — without adding them to the
  selection itself, so deleting a selected frame still only deletes the
  frame. The panel names the selection chip-by-chip up to
  `MAX_SELECTION_CHIPS`, then collapses to one "N items selected" chip.
- Positioned in screen space, not canvas space: panning or zooming the scene
  underneath never drags the panel along with it.
- **Fixed: the panel could be dragged outside the canvas surface.** The drag
  clamp assumed the panel sat flush against its container's corner; it
  actually sits inset by its own margin, so the old bound was off by that
  margin and let the panel escape past the surface's top/left edge. Now
  measured from the panel's real on-screen rect instead of an assumed anchor.
- **Fixed: pressing anywhere on the panel also reached the canvas underneath
  it** — starting a marquee-select or clearing the canvas selection (since
  nothing stopped the pointerdown from bubbling past the panel). The panel
  now stops that at its own root.
- **Fixed: the marquee-select rectangle used a filled background**, hiding
  exactly the blocks it was being drawn over to select. It's outline-only
  now, and the outline itself is a solid neutral gray rather than a
  focus-blue dashed line, which read as a validation/focus state rather than
  a selection tool.
- **`CanvasResolution` and `useCanvasCommands` gain `thinking`.** The model's
  own brief account of why it chose its commands (or none) rides alongside
  `message` in the same JSON response. Rendered as a collapsed, expandable
  "Show reasoning" `ThinkingBlock` on the static prompt bar, and as a
  compact, **non-expandable** two-line summary ("Thinking" plus one
  CSS-truncated line) on `CanvasChatPanel` — there is no control that reveals
  more of it there. Rendered verbatim like `message`, never parsed for
  intent; only the main prompt path (`submit`) populates it — `cluster` and
  `diagram` resolve to a different response shape and clear any stale
  `thinking` from an earlier prompt rather than showing it against an
  unrelated outcome.
