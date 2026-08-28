---
'@mellon-design/react': minor
---

`CanvasBlockOwnProps` gains `chrome?: boolean`, threaded to `Document.chrome` for the `document` block kind (default stays `false`, unchanged behavior). Lets a host render one specific document-kind `CanvasBlock` with `Document`'s standalone, self-contained viewer (list/grid view, zoom) instead of the bare embedded face — useful for a "focused page" view independent of `Canvas`'s own pan/zoom.
