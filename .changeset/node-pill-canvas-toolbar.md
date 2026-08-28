---
'@mellon-design/react': minor
---

Restyled `Node` as a colored pill/chip (new `color`/`fill` props, `--ds-radius-full` by default, a body only when it holds `children`) and fixed a latent bug where its rename input leaked arrow/Delete keys to an ancestor's keyboard handling. `NodeConnector`/`CanvasConnector` default to a thinner stroke to match.

Added a `node` `CanvasBlockData` kind (reusing `Node` in `fill` mode) so pill nodes can be placed directly on `Canvas`, connected via click-to-connect ports through `Canvas`'s own connector system. Added `CanvasToolbar` (`Canvas`'s new `shapeToolbar` prop) — a small floating bar for inserting a sticky note, shape, node, or frame by hand, with no `AIProvider` or resolver required.
