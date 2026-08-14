---
'@mellon-design/react': minor
---

Make the canvas AI-native: `Canvas` gains `aiPrompt` and `aiRewrite`, backed by `CanvasPromptBar`, `CanvasChangePreview`, `useCanvasCommands`, `canvasSnapshot` and `parseCanvasResolution`.

The pipeline is deliberately the same shape the Kanban board already proved — resolve, validate, classify by blast radius, apply or stage — because the policy is the same policy. The vocabulary (`CanvasCommand`) and its validator belong to the library; the transport does not. `resolveCommands` is consumer-owned, and `AIClient` was again left alone rather than widened.

**One line moved versus the board.** A lone `create` applies immediately: adding a block is additive and trivially undone, and making "add a note" open a review panel would make the feature not worth using. Anything that _changes or removes_ existing content — including a lone `move` — is staged. Deletes always are.

Two canvas-specific details in the prompt payload. **Geometry is content here**, not decoration: "put it next to the login note" is only answerable from coordinates, so every block carries its rect. And the scene's occupied bounds ride along, because a model given no placement guidance will cheerfully create ten blocks at `0,0`. The snapshot serializes in reading order, so a truncated scene keeps the blocks a person would have mentioned first.

`CanvasChangePreview` describes commands against the scene **plus the blocks the batch creates**. Without that, "add two notes and connect them" read as `Connect n1 to n2` — naming by id in exactly the case a human most needs a real name, since those blocks don't exist yet.

**A phase-1 accessibility decision is corrected here.** The canvas previously made the whole world `aria-hidden`, treating `CanvasOutline` as its table twin. That was the wrong analogy: a chart's SVG is paths with no text, but canvas blocks hold real content _and real controls_. Once notes gained a "Rewrite with AI" trigger, that design put focusable buttons inside an `aria-hidden` subtree — a violation, not a trade-off, and one no earlier test caught because none enabled `aiRewrite` with a provider.

So blocks are now labelled groups in the accessibility tree, only the connector SVG (pure geometry, whose meaning the outline states as text) stays hidden, and `CanvasOutline` is documented as a navigation aid over the blocks rather than a substitute for them. A `frame` block defers its labelling to `CanvasFrame` so the same name isn't announced twice around nested groups. There's a regression test asserting the per-note trigger stays reachable.

`aiPrompt` renders nothing unless there's an `AIProvider` or a `resolveCommands`; `aiRewrite` needs a provider specifically, since it calls `complete` directly. With neither, markup is byte-identical to the non-AI canvas — asserted by a test and shown in a story. Undo reads `ToastContext` directly rather than `useToast`, which throws outside its provider.
