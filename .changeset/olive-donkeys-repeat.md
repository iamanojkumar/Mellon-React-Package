---
'@mellon-design/react': minor
---

Complete the chart chrome and fold `ChartSurface` into it.

Adds `ChartTooltip` and `ChartDataLabel`, and wires both into `BarChart` and `LineChart`. Hovering reads out the value under the pointer (`showTooltip`, on by default; `renderTooltip` replaces the body), and `showDataLabels` prints values next to their marks (off by default — labels don't self-avoid). The tooltip anchors in percentages of the plot box rather than pixels, so it tracks the scaling SVG without measuring anything. Hit areas span the whole category slot including the gutter, so a pointer between two bars still picks a side. `LineChart` draws a crosshair; `BarChart` deliberately doesn't, since a bar already spans baseline-to-value — it outlines the hovered bar instead.

`ChartDataLabel` only sits outside its mark. In-bar labels need the `-on` contrast roles the Foundation hasn't shipped, so that placement is absent rather than approximated.

**Breaking — `ChartSurface`** is now a thin preset over `BarChart`/`LineChart` instead of a parallel implementation with its own scale math and its own copy of the accessible-table pattern:

- Its root element is a `<figure>`, not a `<div>`; `ref` is now `HTMLElement` and the passthrough props are figure props.
- The table twin now uses row headers and is labelled by the caption, so a category cell is a `rowheader` rather than a `cell`.
- It gains a value axis, gridlines, nice-rounded ticks, a zero-based baseline and the hover readout, and accepts the charts' own options.
- `ChartDataPoint` is now a deprecated alias of `ChartDatum`.

Also adds `slotWidth` to `BandScale` — the full slot including its gutter, which is the width a pointer hit area needs.
