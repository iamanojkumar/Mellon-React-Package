---
'@mellon-design/react': minor
---

Add the first plotted charts: `BarChart` and `LineChart`, both single-series, built on `useChartScale` and `ChartContainer`, plus the shared chrome they compose — `ChartAxis` and `ChartGrid`.

Both charts mount in `ChartContainer`, so the accessible table twin, caption and optional table toggle come for free; the SVG itself stays `aria-hidden`. Bars include zero in the domain by default and grow in both directions from an explicit zero line when the data goes negative. A non-finite value is dropped from the plot but kept in the table, and in `LineChart` it breaks the line into separate segments rather than being interpolated across.

Series colour is still limited to one series by design — `variables.css` defines no categorical palette until the Foundation ships the per-theme roles.

Also exports `resolveChartFrame` and `DEFAULT_CHART_MARGIN` from the chart-scale module, and fixes a `scrollable-region-focusable` accessibility violation in `ChartContainer`, where `Table`'s horizontal scroll container became a scrollable region with no focusable content once `VisuallyHidden` clamped the table twin to 1px.
