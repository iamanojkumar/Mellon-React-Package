---
'@mellon-design/react': minor
---

`ThinkingBlock` now carries the turn's own progress: the trigger reads "Thinking…" while reasoning is in flight and settles to "Thought for 8s" the moment it finishes.

- **`thinking`** — while `true`, the label is "Thinking…" beside a decorative spinner glyph (the same `Spinner` class `StatusLine` reuses). Flipping it to `false` is what swaps the label to the elapsed-time form.
- **`duration`** (seconds) — supply the real span when the transport knows it; omit it and the block measures the `thinking` true→false transition itself, the only span it can observe. A non-finite value is ignored rather than rendered as `NaN`, and a duration alone (no `thinking` pass) renders the finished label directly, which is what a replayed conversation needs.
- **`label` still wins over both**, so existing call sites and any non-English wording are unaffected. With neither `thinking` nor `duration` set the default is the previous "Show reasoning" — this is additive.
- Elapsed time rounds to whole seconds with a one-second floor ("Thought for 0s" reads as a broken readout, not a fast one) and breaks into `1m 5s` past a minute.

Deliberately **not** a live region: `StatusLine` is this cluster's announced-moment component, and a consumer showing both would double-announce the same transition. Pair the two when the moment needs announcing.
