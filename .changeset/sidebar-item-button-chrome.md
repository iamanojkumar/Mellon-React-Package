---
'@mellon-design/react': patch
---

`Sidebar.Item as="button"` no longer shows native `<button>` chrome (background, beveled border, platform font) underneath its own styling — `.item` now resets `background`/`border`/`appearance`/`font` too, matching the earlier `text-align` fix for the same `as="button"` gap. All four are no-ops for the default `as="a"`/`as="div"` targets.
