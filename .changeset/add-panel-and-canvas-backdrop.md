---
'@mellon-design/react': minor
---

Add `Panel`, a persistent non-modal container meant to dock at a viewport edge and fill its height (property-panel/inspector pattern) — `dock` (`start`/`end`), `header`/`footer` pinned rows around a scrollable body. Add `Canvas`'s `renderBackdrop` (renders beneath every block, inside the world transform, for overlaying selectable blocks on external raster content like a `pdf.js`-rendered page) and a controlled `viewport`/`defaultViewport`/`onViewportChange` triple, with the matching `viewport`/`onViewportChange` options added to `useCanvasViewport`. Both close sanctioned-stopgap entries from a real consumer's component-requirements log — see `docs/COMPONENT_LIST.md`'s Phase 31 entry.
