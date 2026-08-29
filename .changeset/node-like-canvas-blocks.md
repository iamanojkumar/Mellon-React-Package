---
'@mellon-design/react': minor
---

Canvas: `node`, `sticky` and `shape` blocks are now fixed-size, connectable, and highlighted rather than framed.

- **Not resizable.** These three kinds no longer draw resize handles regardless of `CanvasBlock`'s `resizable` prop, and `Canvas`'s Alt+arrows announces "<block> can't be resized." instead of resizing them. Every other block kind keeps both paths unchanged.
- **Connection ports on sticky notes and shapes.** They now draw the same input/output port dots `node` blocks have, wired to the same click-to-arm/click-to-complete `connect` command — so a sticky note can be wired to a shape, or to a node. Ports render only when `onInputPortClick`/`onOutputPortClick` are supplied, so a `readOnly` canvas shows none.
- **Selection is a rounded highlight** for these kinds, not the rectangular frame with corner points.

`CanvasBlock` newly exports `isNodeLikeBlockKind` and `NODE_LIKE_BLOCK_KINDS`.

Note for consumers with tests: a sticky note or shape on an editable canvas now contributes two `<button>`s (its ports), so unscoped `getAllByRole('button')` queries over a `Canvas` will pick them up.
