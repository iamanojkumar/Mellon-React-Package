---
'@mellon-design/react': minor
---

Add a `Node`/`NodeGraph` family, and strip `StickyNote`'s shadow, border, and radius.

- **New standalone `Node`/`NodeConnector`/`NodeGroup`/`NodeGraph` family** —
  not a `Canvas` block kind, so it and its data can be used or referenced from
  any module. A node's `data` is `unknown`: it can hold a string, a form
  value, or an entire scene parsed from another module (a `Canvas` `scene`, a
  `Document`'s `pages`) — `NodeGraph` never inspects it, only positions the
  box and hands it to `renderNode`.
- **Connecting is derived, not copied.** Connecting node A's output to node
  B's input doesn't merge data at connect time. `computeNodeOutput` (new,
  `utilities/nodeGraph.ts`) derives B's effective output — `{ [A.id]: A.data,
[B.id]: B.data }`, through a whole chain — on every read, from any module,
  so it always reflects the current graph. `canConnect`/`wouldCreateCycle`
  reject a self-connection, a duplicate, or anything that would close a loop,
  checked before a connection is made.
- **Connecting is click-driven, not drag-driven**: click a node's output port
  to arm it, then a target's input port to complete the connection (or
  Escape to cancel) — reachable from the keyboard the same way every other
  pointer-only gesture in this library gets a non-pointer path. Repositioning
  stays pointer-drag-only, with arrow keys as its keyboard equivalent once a
  node is selected, the same split `Canvas` draws between spatial dragging and
  keyboard navigation.
- **Grouping is data, not geometry** — a `NodeGroupData.nodeIds` list, unlike
  `CanvasFrame`'s geometric containment. Shift-click multi-selects; `G` groups
  2+ selected nodes into a new named `NodeGroup` (double-click to rename,
  `onUngroup` to dissolve without touching members); Delete removes selected
  nodes along with any connection touching them.
- **`StickyNote` loses its box-shadow, border, and border-radius** — the tone
  accent edge (`border-inline-start`) is unchanged.
