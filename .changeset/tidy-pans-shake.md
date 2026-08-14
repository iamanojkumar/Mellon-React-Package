---
'@mellon-design/react': minor
---

Canvas phase 4: `aiDiagram`, plus two frame rendering fixes.

`Canvas` gains `aiDiagram`, a bar you describe a flow into — it's drawn as
shapes and connectors. The model returns a graph of nodes and edges with no
coordinates; the new `src/utilities/canvasDiagram.ts` owns everything spatial:
`breakDiagramCycles` (so a retry loop can't invert the reading order),
`rankDiagramNodes`, `layoutCanvasDiagram`, `diagramCommands`. A node's `role`
(start, decision, process…) maps onto the shape vocabulary in the library.

Unlike clustering, a diagram is applied immediately with an undo toast: it adds
content and touches nothing that already existed. That claim is checked by the
new `isPurelyAdditive` rather than assumed, and a batch failing it falls back to
the review panel.

Two rendering fixes to `Canvas`/`CanvasFrame`, both visible on any framed scene:

- Connectors now paint **above frames** and below other blocks. The connector
  layer previously rendered under every block, so a frame — a full-size
  backdrop — hid every edge inside it.
- A frame is now an **unfilled boundary** (dashed edge plus title). Its
  `surface-secondary` fill was the same colour a clipped `CanvasShape` uses, so
  a diamond placed on a frame was invisible.

Also exported: `normalizeCanvasDiagram`, `parseCanvasDiagramResolution`,
`buildCanvasDiagramPrompt`, `diagramNodeShape`, `DEFAULT_DIAGRAM_LAYOUT`, and
`useCanvasCommands`' new `diagram`/`diagramAvailable`.
