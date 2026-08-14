---
'@mellon-design/react': minor
---

Add `aiExplain` to the chart track — a plain-language reading of the plotted series.

The affordance lives on `ChartContainer`, so `BarChart`, `LineChart` and `ChartSurface` all inherit it by mounting there rather than each wiring its own; the same reasoning that put the accessible table twin in the container. Opt-in via `aiExplain`, with `buildAIPrompt` to replace the prompt and `aiExplainLabel` to rename the trigger.

It follows the existing AI conventions exactly: no vendor SDK, key or `fetch` in the library, one `useAIAction` instance per container, and — the load-bearing rule — nothing rendered at all unless an ancestor `AIProvider` is mounted, so the output is byte-identical to today's without one. Read-only like `Alert`'s explanation: there are no accept/reject actions, because a chart's data belongs to the caller and there is nothing to write back into.

Two details specific to charts. The prompt is built from the `data` prop directly rather than by scraping the rendered DOM the way `Table` must, and the series is also forwarded on the `context` bag so a client can use the structured form. Values are stated through the chart's own `formatValue`, so the prompt reads in the same units as the axis, and a non-finite reading is described as `no data` rather than sent as `NaN` — the same refusal to invent a measurement that makes `LineChart` break its line at a gap.

Exports `ChartAIProps` and `ChartExplainPromptOptions`.
