---
'@mellon-design/react': minor
---

Close five gaps reported from a consumer app.

- **`RichTextEditor` gains `aiRewrite`** (plus `buildAIPrompt` /
  `aiTriggerLabel`), matching `TextArea`'s prop shape — it was the last text
  surface in the library with no AI affordance. The trigger sits at the end of
  the toolbar row rather than floating over the writing surface, and the
  suggestion is applied as HTML so formatting survives the rewrite. Inert
  without an `AIProvider`, and the markup is byte-identical to before whenever
  it doesn't apply.
- **`Avatar` gains `color` and `colorFrom`** for tinting the initials
  fallback, so accounts stop looking identical. `colorFrom` hashes any key (an
  account id, an email) into a stable tint. Every tint is a foundation
  `*-subtle` fill with its own hue-matched `*-on-subtle` foreground, measured
  at 12.97:1–16.39:1 in light, dark and high-contrast. The tint is decoration
  only — the initials and accessible name carry identity.
- **`Input`, `TextArea` and `RichTextEditor` gain `onAIOpenChange`,
  `onAIAccept` and `onAIReject`.** An accepted AI suggestion previously
  reached the consumer as an ordinary `onChange`, indistinguishable from a
  keystroke, leaving a call site no way to instrument the flow.
- **Fixed: `Breadcrumb.Item as="button"` rendered with native button chrome.**
  A trail step that navigates through a router has no `href`, so `as="button"`
  is a real call site; the module never reset the UA's border/background/
  padding/font-size, and hover/focus were keyed off `a.item` so a button got
  neither. Both fixed.
- **New tokens**: `--ds-color-status-info` and
  `--ds-color-status-{info,success,warning,danger}-{subtle,on-subtle}` in
  `variables.css`, mapping foundation roles that were already published but
  unaliased.

Also investigated, and **not** a defect: a suspected `Accordion.Content`
staleness bug does not reproduce. `Accordion.Content` renders `{children}`
unconditionally, with no memo, cloning or cached element; two regression tests
now record that for both open and closed items.
