# Chart Token Requirements

> Requirements hand-off for `mellon_designsystem_foundation` (published as
> [`@mellon-design/tokens-web`](https://www.npmjs.com/package/@mellon-design/tokens-web)).
> Audited against `@mellon-design/tokens-web@1.0.0` — `css/tokens.css` (711
> lines of primitives) and `css/theme-{light,dark,high-contrast}.css` (40
> semantic color roles each).
>
> Written to unblock the chart-component track in this repo. No chart
> component can be built until these exist, because this library's standing
> rule is that every color/spacing/radius value references a `--ds-*` token
> mapped from a Foundation token — never a raw literal.

## Verdict

**The primitive layer is already sufficient. The semantic layer is a total gap.**

| Layer      | File          | Status for charts                                                                                                                                     |
| ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primitives | `tokens.css`  | ✅ Sufficient — 15 hue families × 12 steps, radius, border-width, spacing, alpha, motion all cover chart needs. **1 genuine gap** (tabular numerals). |
| Semantic   | `theme-*.css` | ❌ **Zero data-viz roles.** All 40 existing roles are UI-chrome (surface/text/border/accent/status). ~49 new roles needed per theme.                  |

The primitives being complete is the good news: **no new base colors need to
be invented.** Every categorical, sequential, and diverging slot below can be
filled by pointing at an existing ramp step.

Of the 15 hue families, **12 are usable for categorical work** — `gray`
(chroma 0.0), `neutral` (0.005), and `slate` (0.022) are effectively
achromatic. That 12 is what caps the search in "The measured ceiling" below.

## Why these belong in the Foundation, not in this repo's `variables.css`

`src/styles/variables.css` is a **mapping file only** — it aliases Foundation
names to `--ds-*` names and holds no values of its own. The contract is that a
Foundation revision changes that file and nothing else.

Chart color can't be derived; it must be **selected per theme**. A dark-mode
categorical palette is its own set of ramp steps chosen against the dark
surface — not an automatic flip of the light one. Encoding that selection in
`variables.css` would mean hand-picking per-theme values in the consumer,
which breaks the mapping-only contract and puts the palette out of reach of
any other Foundation consumer (iOS, Android, Figma).

So: **Foundation defines the roles in `theme-*.css`; this repo maps them to
`--ds-chart-*` and stops there.**

---

## A. Categorical — series identity (24 roles/theme)

The core requirement. Used when the series _are_ the subject: grouped/stacked
bars, multi-line, legends.

| Role                                               | Count | Purpose                                                             |
| -------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| `--semantic-color-chart-categorical-{1..8}`        | 8     | The mark fill/stroke                                                |
| `--semantic-color-chart-categorical-{1..8}-subtle` | 8     | Area fills under lines, hover backgrounds, selected-row tints       |
| `--semantic-color-chart-categorical-{1..8}-on`     | 8     | Text/icon color legible **on top of** the mark (in-bar data labels) |

### Hard constraints on the assignment

These are not stylistic preferences — a palette violating them is rejected:

1. **Fixed order, never cycled.** Series 1 always gets slot 1. A filter that
   removes series 2 must not repaint series 3.
2. **5 slots are safe on color alone; slots 6–8 require secondary encoding**
   (texture, direct label, or shape) — see "The measured ceiling" below. 8 is
   the hard ceiling; a 9th series folds into "Other," facets into small
   multiples, or uses composite encoding. Never a generated 9th hue.
3. **All-pairs CVD separation ≥ 8 ΔE** (OKLab ×100) under deuteranopia,
   protanopia, and tritanopia at severity 1.0. 6–8 is a floor legal _only_ with
   a secondary encoding (texture/shape/direct label).
   **All pairs, not adjacent pairs** — a legend renders every slot
   simultaneously and a reader compares any pair against any other. An
   adjacent-only test passes palettes that are unreadable in practice.
4. **Normal-vision separation ≥ 15 ΔE**, all pairs. Below this is a hard fail —
   full-color readers can't distinguish them either.
5. **Contrast ≥ 3:1 against its own theme's plot surface**, every theme.
6. **Must not collide with the status palette** (§D) — a reader must never
   confuse "series 4" with "error." Measure against the real status values;
   `teal-600` lands within 4.9 ΔE of `info`, which is not visible by eye.

**Validate, don't eyeball.** Run the palette through
`scripts/validate-palette.mjs` in the Foundation repo. Reasoning about ΔE by
eye is the single most common way a categorical palette ships broken.

### Why a naive assignment fails here — the constant-L trap

**The most important constraint in this document.**

`generate-color-primitives.mjs` holds OKLCH `L` **constant across all 15
families at each step** — verified: every family's step 600 is exactly
`L=0.54`. `tests/build/color-primitives.test.mjs` guards this property, and it
is genuinely correct for UI work: a border swapped from blue to red keeps its
visual weight.

For categorical charts it is actively harmful. **CVD collapses the hue axis and
leaves lightness as the primary surviving channel.** A palette drawn from a
single step therefore has near-zero lightness variance by construction, and
under simulation it collapses toward one color no matter which hues are chosen.

> **A categorical palette must stagger steps deliberately.** This is the one
> place in the system where the constant-L guarantee works against you.

### The measured ceiling

Multi-start greedy over 12 usable chromatic families × 6 steps,
contrast-constrained. A lower bound on the true optimum, not exhaustive:

| series | light    | dark     | verdict                  |
| ------ | -------- | -------- | ------------------------ |
| 3      | 30.1     | 29.6     | safe on color alone      |
| 4      | 21.5     | 20.7     | safe on color alone      |
| **5**  | **16.7** | **18.4** | **safe on color alone**  |
| 6      | 14.5     | 13.8     | needs secondary encoding |
| 7      | 12.2     | 12.1     | needs secondary encoding |
| 8      | 10.9     | 11.3     | needs secondary encoding |

**8 CVD-safe categorical slots do not exist in this palette** — and likely in
no palette. Best achievable at 8 is ~11 ΔE, under constraint 4's own ≥15 bar.
This is close to a perceptual limit, not a gap in the ramps, so it cannot be
fixed by adding families upstream.

### Slot ordering: brand-led

**Slot 1 is blue**, inheriting `--semantic-color-accent-default`. Measured both
ways and the choice is not binding: at 8 slots everything is marginal (light:
7.8 brand-led vs 9.0 separation-first — both failing constraint 3), and in dark
mode the optimizer returns an identical palette either way. Brand coherence is
therefore free.

### The assignment is still owed

Staggered across steps (not drawn from one band), all-pairs validated, 5
color-only slots plus 3 requiring secondary encoding. The Foundation's
validator has a `--suggest` mode planned to generate and check it in one step.

> **Worked example of the trap.** A palette taking all 8 slots from the
> 400–700 band measured 8/8 on contrast but collapsed on separation: dark slot
> `blue-400` vs `violet-400` came out **0.9 ΔE** apart under deuteranopia,
> `orange-400` vs `lime-400` 1.1, and five slots collided with the status
> palette. Every failure but one was non-adjacent — which is why constraint 3
> tests all pairs.

### Subtle and on-color derivation

`-subtle` should resolve to roughly the `100`/`200` step of the same hue in
light and an alpha-composited version in dark. `-on` resolves to whichever of
`text-primary`/`text-inverse` clears 4.5:1 against that slot.

## B. Sequential — magnitude (7 roles/theme)

`--semantic-color-chart-sequential-{1..7}`

One hue, light → dark, more-is-darker. The safe default for heatmaps, choropleth-style
grids, and any "compare magnitude" bar chart. **Never a rainbow.**

- Light mode: ascending steps of a single ramp (e.g. `blue-100` → `blue-900`).
- Dark mode: **not** the reverse. Re-select against the dark surface so step 1
  is still visible and step 7 doesn't blow out.
- Step 1 must clear 3:1 against the plot surface, or the low end vanishes.

## C. Diverging — polarity (7 roles/theme)

`--semantic-color-chart-diverging-{neg-3,neg-2,neg-1,neutral,pos-1,pos-2,pos-3}`

Two hues + a **neutral gray midpoint**. For above/below baseline, Δ-to-target,
and Likert/sentiment scales.

- Two poles only, one warm one cool. Recommend `red`/`orange` ↔ `blue`/`teal`.
- **The midpoint is gray, never a hue.** A colored midpoint makes zero look
  like a value.
- The two poles must remain distinguishable under CVD — red↔green is the
  classic failure and is disallowed.
- Do **not** reuse the status error/success hues here (see §D).

## D. Status in charts (4 roles/theme — may alias)

`--semantic-color-chart-status-{good,warning,serious,critical}`

Reserved for actual state, never for "series 4." Ships with an icon or label —
never color alone.

Foundation already has `success` / `warning` / `error` / `info`. Three map
cleanly; **`serious` (the level between warning and critical) has no existing
equivalent.**

**Add `serious` rather than collapsing to 3 levels.** High-contrast already
carries four full status families, so the asymmetry is confined to the semantic
layer — and a 4-level severity that degrades to 3 is far easier than
retrofitting the reverse.

| Chart role | Existing Foundation role           | Gap?                                        |
| ---------- | ---------------------------------- | ------------------------------------------- |
| `good`     | `--semantic-color-success-default` | alias                                       |
| `warning`  | `--semantic-color-warning-default` | alias                                       |
| `serious`  | —                                  | **new** (orange, between warning and error) |
| `critical` | `--semantic-color-error-default`   | alias                                       |

## E. Chart furniture — grayscale chrome (7 roles/theme)

The recessive scaffolding. Existing UI roles are close but wrong: a gridline
must be _more_ recessive than `border-subtle`, or the grid competes with the data.

| Role                                 | Purpose                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------ |
| `--semantic-color-chart-surface`     | Plot-area background (often but not always `surface-primary`)            |
| `--semantic-color-chart-axis`        | Axis lines                                                               |
| `--semantic-color-chart-grid`        | Gridlines — deliberately fainter than `border-subtle`                    |
| `--semantic-color-chart-tick-label`  | Axis tick text                                                           |
| `--semantic-color-chart-crosshair`   | Hover crosshair line                                                     |
| `--semantic-color-chart-annotation`  | Reference/target/threshold lines                                         |
| `--semantic-color-chart-de-emphasis` | The gray for "Other" and for non-highlighted series in an emphasis chart |

`chart-de-emphasis` is load-bearing, not decorative — the emphasis form (one
series in accent, all others gray) is the most useful and most underused chart
type, and it has no gray to point at today.

## F. Non-color primitives

### F.1 Tabular numerals — **genuine gap, and the only primitive one**

```css
--font-numeric-tabular: tabular-nums;
--font-numeric-proportional: proportional-nums;
```

Chart axis values, tooltip readouts, stat-tile deltas, and any live-updating
number need `font-variant-numeric: tabular-nums`, or digits change width as
values change and the number visibly jitters on hover and during streaming
updates.

`--font-family-mono` exists and its comment says it is "reserved for the code
semantic style and other tabular/technical content" — but swapping to a
monospace _family_ is not the same thing, and is wrong for a chart axis that
should stay in the body face. This is a `font-variant-numeric` value, not a
family. **No existing token expresses it.**

Worth also considering a `--semantic-typography-data-*` style set (the
existing pattern has `body-*`, `caption-default`, `code-default`) that bundles
the body face at caption size with tabular figures — this is what every axis
label and tooltip value wants.

### F.2 Mark geometry — no new primitives needed

Chart mark specs land exactly on existing values. These should become
`--ds-chart-*` aliases **in this repo**, not new Foundation tokens:

| Need                                         | Existing primitive      | Value            |
| -------------------------------------------- | ----------------------- | ---------------- |
| Line stroke width                            | `--border-width-medium` | 2px ✅           |
| Rounded data-end radius                      | `--radius-sm`           | 0.25rem = 4px ✅ |
| Gap between stacked segments / adjacent bars | `--border-width-medium` | 2px ✅           |
| Surface ring on overlapping marks            | `--border-width-medium` | 2px ✅           |
| Minimum accessibility marker size            | `--spacing-2`           | 0.5rem = 8px ✅  |

Aliasing them (`--ds-chart-stroke-width`, `--ds-chart-mark-radius`,
`--ds-chart-gap`, `--ds-chart-marker-size`) is worth doing anyway: it names the
_intent_, so a chart's 2px gap isn't mistaken for a border and "fixed" later.

### F.3 Texture fill — **not a token**

Charts need one directional hand-drawn fill at 45°/135° for the full-CVD,
print, and `forced-colors` cases. This is an SVG `<pattern>`, not a value —
it belongs in the chart layer's shared `<defs>`, the same way this library
hand-rolls every icon rather than taking an icon dependency. **No Foundation
token required.** Listed here only so it isn't mistaken for a gap.

---

## G. High contrast — retain hue

**22 of the 40 HC roles retain chroma; only 18 are achromatic.** Every status
family keeps its hue at high steps — `success` → `green-900`, `warning` →
`orange-*`, `error` → `red-*`, `info` → `cyan-*`, and `accent`/`text-link`/
`border-focus` → `blue-800..950`. The 18 that collapse to `oklch(L 0 0)` are
`surface.*`, `text.*`, and `border.*`, and only because they alias the `gray`
family, which is generated at `peakChroma: 0.0`.

The theme's own `$description` reads _"light-based, tuned for WCAG AAA text
contrast and stronger boundary definition."_ Not monochrome: **neutral chrome,
high contrast, hue preserved wherever hue carries meaning.**

### The decision

**Chart categorical roles retain hue in high-contrast**, selected at high steps
(800–950) against the light surface — exactly the treatment
`success`/`warning`/`error` already get. This is not an exemption from the
theme's premise; it _is_ the premise, applied consistently.

Reducing chart hue to a grayscale lightness ladder in HC is explicitly **not**
the approach: it would make charts the only family in the theme to discard hue,
and would cap usable series at ~4.

### Texture still ships — for a different problem

Texture (§F.3) remains required, but for **`@media (forced-colors: active)` and
print**, where the OS discards token values entirely and no amount of theming
survives. That is a genuinely separate concern from HC theming, and the §F.3
placement (chart-layer `<defs>`, not a token) is correct for it.

Texture is **also** now a baseline requirement at high series counts in every
theme — see §A constraint 2. Slots 6–8 are not CVD-safe on color alone in any
theme, so they need texture, direct labels, or shape regardless of high
contrast.

---

## Summary of the ask

| Bucket               | New Foundation tokens            | Per theme | × 3 themes |
| -------------------- | -------------------------------- | --------- | ---------- |
| A. Categorical       | 24                               | 24        | 72         |
| B. Sequential        | 7                                | 7         | 21         |
| C. Diverging         | 7                                | 7         | 21         |
| D. Status            | 1 new + 3 aliases                | 4         | 12         |
| E. Furniture         | 7                                | 7         | 21         |
| **Semantic total**   |                                  | **49**    | **147**    |
| F.1 Tabular numerals | 2 primitives (theme-independent) |           | 2          |

Everything else charts need — ramps, radius, border-width, spacing, alpha,
motion, elevation, z-index — the Foundation already ships.

### Settled by measurement

| Question               | Resolution                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| High-contrast strategy | **Retain hue** at steps 800–950 (§G). Texture is scoped to `forced-colors`/print, not HC theming. |
| Slot ordering          | **Brand-led; slot 1 blue** (§A). Non-binding — dark mode returns an identical palette either way. |
| Series safe on color   | **5.** Slots 6–8 require secondary encoding in every theme.                                       |

### What is still owed

1. **The final slot assignment** — staggered across steps (not drawn from one
   band), all-pairs validated, 5 color-only slots + 3 requiring secondary
   encoding. Blocked on nothing; can be generated by the validator's proposed
   `--suggest` mode.
2. **A consumer-side guarantee for slots 6–8.** The Foundation's validator now
   accepts a `secondaryEncoding` declaration for groups that pair color with a
   non-color channel. Chart categorical will _fail hard_ without one, which is
   correct — but see `TOKEN_AUDIT.md` Part F: that guarantee is currently
   unenforced on this side, and this library already violates it in three
   components.
