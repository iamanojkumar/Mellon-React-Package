# Token Audit — `@mellon-design/react` → Foundation hand-off

> **Audited:** 2026-08-11 · `@mellon-design/react@0.1.0` (124 components)
> against `@mellon-design/tokens-web@1.0.0` (745 tokens).
> **Companion doc:** [`CHART_TOKEN_REQUIREMENTS.md`](./CHART_TOKEN_REQUIREMENTS.md)
> covers the data-viz roles separately; this audit covers everything else.
> **Status:** not yet sent to the Foundation owner — Parts A–C are unanswered,
> and **A5 blocks C2**. Part F is fixed.

## Executive summary

The token _plumbing_ is healthy — **no broken references in either
direction.** All 50 `--ds-*` names used by components are defined, and all 74
Foundation tokens that `variables.css` maps to actually exist. Nothing
silently resolves to `initial`.

The problems are all **coverage**, in four buckets split by owner:

| Bucket                                                                      | Owner      | Count        | Severity         |
| --------------------------------------------------------------------------- | ---------- | ------------ | ---------------- |
| **A. Foundation gaps** — values components need that no token expresses     | Foundation | 5            | 1 high, 4 medium |
| **B. Mapping gaps** — Foundation ships it, `variables.css` never aliases it | This repo  | 5 families   | 1 high, 4 low    |
| **C. Local violations** — this repo breaking its own rules                  | This repo  | 3            | 1 medium, 2 low  |
| **F. Secondary-encoding guarantee** — status color as the only channel      | This repo  | 3 components | ✅ fixed         |

**The single highest-value fix is A1 (focus ring).** It alone accounts for 40
hand-rolled occurrences across 30 files and is a visible accessibility
inconsistency, not just a hygiene issue.

---

# Part A — Foundation gaps (asks for the Foundation owner)

## A1. Focus ring geometry — **HIGH** 🔴

**The Foundation ships the focus _color_ and nothing else.**
`--semantic-color-border-focus` exists; there is no width, offset, or style
token. So all 124 components hand-roll the ring, and they have diverged into
**two mutually incompatible implementations**:

| Implementation                                       | Occurrences | Files  |
| ---------------------------------------------------- | ----------- | ------ |
| `outline: 2px solid var(--ds-color-border-focus)`    | 27          | 18     |
| `box-shadow: 0 0 0 2px var(--ds-color-border-focus)` | 13          | 12     |
| **Total**                                            | **40**      | **30** |

…and three different offsets are in play: `outline-offset: 2px` (19×), `-2px`
(5×), `1px` (3×). One component (`PhoneField`) uses an `inset` box-shadow
ring, a third geometry again.

**Why this is a real defect, not just duplication.** `outline` and
`box-shadow` behave differently: `outline` is not clipped by `overflow: hidden`
and survives `forced-colors` mode; `box-shadow` is clipped and is _dropped
entirely_ in forced-colors. Two components sitting side by side in the same
form can therefore have visibly different — and in Windows High Contrast,
one _absent_ — focus indicators. The 2px width is also load-bearing for WCAG
2.4.13 (Focus Appearance) and is currently an undeclared magic number
repeated 40 times.

### Requested tokens

```css
--semantic-focus-ring-width: 2px; /* WCAG 2.4.13 minimum */
--semantic-focus-ring-offset: 2px;
--semantic-focus-ring-offset-inset: -2px; /* controls that ring inside their bounds */
--semantic-focus-ring-style: solid;
```

A composite would be even better, since it lets the Foundation settle the
`outline`-vs-`box-shadow` question once for every platform consumer:

```css
--semantic-focus-ring: var(--semantic-focus-ring-width) var(--semantic-focus-ring-style)
  var(--semantic-color-border-focus);
```

**Recommendation:** standardize on `outline` + `outline-offset` for the
forced-colors and overflow reasons above. Once the tokens land, this repo
collapses 40 hand-rolled rules into one shared rule.

## A2. Long-loop motion duration — **MEDIUM**

`--motion-duration-*` tops out at `slower: 600ms`. Indeterminate progress
loops need roughly 4× that, so three components hardcode `2.5s`:

- `CircularProgress.module.css:33`
- `Progress.module.css:42`
- `Spinner.module.css:34`

The existing scale is built for _transitions_ (state changes a user waits on);
a continuously looping animation is a different job and needs its own value —
too fast reads as frantic, and it is not a duration you'd ever want coupled to
the transition scale.

```css
--motion-duration-loop: 2500ms; /* indeterminate/looping animations */
```

## A3. Reduced-motion floor — **MEDIUM**

`Drawer.module.css:156` and `Toast.module.css:173` hardcode
`animation-duration: 1ms` inside `@media (prefers-reduced-motion: reduce)`.

`--motion-duration-instant: 0ms` exists but **cannot be used here**: at `0ms`
some browsers never fire `animationend`, so any component that unmounts on
that event hangs open forever. `1ms` is the standard workaround, and it is
exactly the kind of non-obvious constant a token layer should own rather than
leave for each component to rediscover.

```css
--motion-duration-minimal: 1ms; /* reduced-motion floor; 0ms breaks animationend */
```

## A4. Contrast ring for arbitrary-color surfaces — **MEDIUM**

`ColorPicker`'s thumb sits on top of the **arbitrary color the user is
currently picking**, so no theme-aware token can guarantee it stays visible.
It currently hardcodes the standard solution — a white border plus a dark
outer ring:

```css
/* ColorPicker.module.css:59-61, and again at 99-101 */
border: 2px solid white;
box-shadow: 0 0 0 1px rgb(0 0 0 / 40%);
```

This pattern is not unique to `ColorPicker` — any future eyedropper, image
cropper, chart-on-photo overlay, or map marker needs the identical treatment.
It deserves a named role rather than being copied.

```css
--semantic-color-on-arbitrary-light: <white>; /* inner ring */
--semantic-color-on-arbitrary-dark: <black/40%>; /* outer ring */
```

Note these are **theme-invariant by design** — they must _not_ flip in dark
mode, because the surface they sit on is user data, not the theme.

## A5. Disabled-opacity semantic — **MEDIUM**

Foundation ships `--opacity-38: 0.38` with the comment _"Conventional
disabled-content opacity."_ — but that is a **primitive**, not a semantic
role, so no component reaches for it. Instead, 17 components hardcode
`opacity: 0.6` (19 occurrences), which is not merely untokenized but
**contradicts the Foundation's own documented value.**

Either the Foundation's 0.38 or the library's 0.6 is wrong; they cannot both
be right. This needs a semantic role so the answer lives in one place:

```css
--semantic-opacity-disabled: var(--opacity-38); /* or --opacity-56, pending decision */
```

**Decision needed:** 0.38 (Foundation's stated convention, Material-derived)
or 0.6 (what 17 components actually do today)? 0.38 over a light surface can
push disabled text below the 4.5:1 floor, which may be why the library drifted
upward. Whichever wins, it should win everywhere.

---

# Part B — Mapping gaps (this repo's work; **no Foundation change needed**)

`variables.css` maps 74 of the Foundation's 745 tokens into 52 `--ds-*` names,
across 15 families. These families exist upstream and are simply never aliased,
so component authors have no `--ds-*` name to reach for and hardcode instead.

## B1. `border-width` — **HIGH** 🔴

Foundation ships all five (`none`/`hairline`/`thin`/`medium`/`thick`).
**Zero are mapped.** Result: `1px` appears 62× and `2px` 63× across component
CSS as bare literals.

```css
--ds-border-width-thin: var(--border-width-thin); /* 1px */
--ds-border-width-medium: var(--border-width-medium); /* 2px */
```

This is also a prerequisite for the chart work — `CHART_TOKEN_REQUIREMENTS.md`
§F.2 maps every chart mark-geometry value onto these.

## B2. `opacity` — **LOW** (blocked on A5)

All 16 Foundation opacity primitives are unmapped. Once A5 settles the
disabled value, map at least the semantic role.

## B3. Unmapped motion tokens — **LOW**

Present upstream, never aliased: `--motion-duration-instant` (0ms),
`--motion-duration-moderate` (300ms), `--motion-duration-slower` (600ms),
`--motion-easing-linear`, `--motion-easing-emphasized`, and all four
`--motion-delay-*`. `--ds-motion-easing-accelerate` is mapped but **unused** by
any component — worth confirming exit animations are actually using it.

## B4. Unmapped sizing families — **LOW**

`--size-icon-*` (6), `--size-control-*` (5), `--size-avatar-*` (6),
`--aspect-ratio-*` (6), `--grid-columns/gutter/margin-*` (15) are all unmapped.
This is plausibly deliberate — components define their own intrinsic geometry —
but `--size-avatar-*` in particular looks like it should be backing `Avatar`,
and `--size-icon-*` should be backing the inline SVG sizes. Worth a decision
rather than drift.

## B6. Status `-subtle` / `-on-subtle` pairs — **RESOLVED** ✅

The foundation ships each status family as a _pair_: a far-end tint
(`*-subtle`, L 0.955 in light/high-contrast, L 0.27 in dark) and a
hue-matched foreground at the opposite end (`*-on-subtle`). Neither half was
mapped, so "a tinted fill with readable text on it" wasn't expressible in
component CSS at all — the gap that pushed a consumer to hand-roll a
15-colour avatar palette outside the token system entirely.

Now mapped as `--ds-color-status-{info,success,warning,danger}-subtle` and
`-on-subtle`, plus `--ds-color-status-info` (the `info` family had no
`-default` alias either). Measured in a real browser across all three
themes, the pairs land at 12.97:1 – 16.39:1 — comfortably past WCAG AA.

**Still open, and a genuine Part A ask:** there is no `accent-on-subtle`.
`accent-subtle` alone is unusable as a fill, because no existing role is
guaranteed to read on it in _both_ light and dark. This is why `Avatar`'s
tint vocabulary is the four status hues plus neutral, with no `brand`
option — picking a foreground for accent-subtle in `variables.css` would
mean inventing a per-theme value, which this mapping-only file doesn't do.

## B5. Unused `--ds-*` tokens — **INFO**

Defined but referenced by nothing: `--ds-motion-easing-accelerate`,
`--ds-radius-none`, `--ds-space-none`. Harmless; listed for completeness.

---

# Part C — Local rule violations (fix in this repo)

## C1. Fallback literals in `reset.css` — **MEDIUM**

Three violations of the standing "never a fallback literal when the token
exists unconditionally" rule:

```css
/* src/styles/reset.css:17,20,21 */
line-height: var(--ds-line-height-base, 1.5);
color: var(--ds-color-text-primary, #111111);
background-color: var(--ds-color-surface-primary, #ffffff);
```

These fallbacks are **provably dead** — `src/styles/index.css` imports
`variables.css` _before_ `reset.css`, so all three tokens are always defined.
The hardcoded `#111111` / `#ffffff` are also the only raw hex left in the
non-component styles, and they would silently produce a light-mode-looking
body in any future context where the import order changed.

**Fix:** delete the fallbacks. One-line change, no behavior difference.

## C2. Disabled opacity drift — **MEDIUM** (see A5)

19 hardcoded `opacity: 0.6` across 17 components. Blocked on the A5 decision;
once a semantic role exists this becomes a mechanical find-and-replace.

## C3. `PhoneField` inset focus ring — **LOW**

`PhoneField.module.css:37` is the lone `inset` box-shadow ring in the library
— a third focus geometry alongside the two in A1. Folds into the A1 cleanup.

---

# Part D — Checks that came back clean ✅

Recorded so the next audit knows what was covered and can diff against it.

| Check                                                   | Result                                                                                                                       |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `--ds-*` used but never defined                         | **0** — no reference resolves to nothing                                                                                     |
| `variables.css` → nonexistent Foundation token          | **0** of 74 mappings broken                                                                                                  |
| Foundation tokens referenced directly in component code | **0** — the "components never name a Foundation token" contract holds perfectly across all 124 components                    |
| Raw hex/rgb/hsl in component CSS                        | **11, all in `ColorPicker`, all legitimate** — see below                                                                     |
| Inline `style={{}}` with color/px literals in `.tsx`    | **0**                                                                                                                        |
| Hardcoded `z-index`                                     | **2**, both `z-index: 1` for local stacking context — correct, not a token concern                                           |
| Hand-rolled `box-shadow` for elevation                  | **0** — every elevation uses `--ds-elevation-*`; the only raw box-shadows are focus rings (A1) and the ColorPicker ring (A4) |

**On `ColorPicker`'s 11 raw colors:** these are the correct call and should
_not_ be tokenized. The hue rail (`hsl(0…360, 100%, 50%)`) is a color-science
constant — the visible spectrum does not change with your brand — and the
saturation/value square's `#fff`→transparent and `#000`→transparent gradients
are the mathematical definition of an HSV square. All are already documented
with explanatory comments in the file. The _only_ part of `ColorPicker` that
needs a token is the thumb ring (A4).

---

# Part F — The secondary-encoding guarantee — ✅ **FIXED**

The reciprocal obligation created by the Foundation's `validate-palette.mjs`
work. Three components violated it; all three are now fixed.

## Why the guarantee exists

The Foundation's status palette contains values that cannot pass on color
alone:

```
[dark]  success.default vs error.default: 1.6 ΔE  (deuteranopia)
[light] success.default vs info.default:  2.9 ΔE  (tritanopia)
[hc]    success.default vs info.default:  1.4 ΔE  (tritanopia)
```

**These are not tuning failures.** `success` is green and `error` is red;
deuteranopia makes those the same color by definition, and no selection from
these ramps fixes it. The Foundation's resolution is correct: status groups
declare `secondaryEncoding`, downgrading the check to advisory **on the
explicit guarantee that consumers pair status color with an icon or label.**

That guarantee is this library's to keep. **Nothing currently enforces it, and
we are already violating it.**

## Audit result — 29 components use `--ds-color-status-*`

**26 pass.** The color is genuinely redundant:

| Component                               | Non-color channel                                                         |
| --------------------------------------- | ------------------------------------------------------------------------- |
| `Alert`, `Banner`, `Toast`              | `AlertVariantIcon` per variant                                            |
| `Statistic`                             | `▲` / `▼` trend glyphs (rendered as text, so screen readers get them too) |
| `TokenCounter`                          | `"{count} / {limit}"` numeric text                                        |
| `ToolTraceViewer`, `TreeView`, `Rating` | per-state icons                                                           |
| `MessageBubble`                         | a 4px left border _appears_ — presence, not hue, is the signal            |

**3 failed** — status color was the only channel. All now fixed:

| Component      | Defect as found                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`Badge`**    | `color="success" \| "warning" \| "danger"` with arbitrary `children` and no icon. A badge reading `"3"` in green and one reading `"3"` in red were **identical** under deuteranopia. |
| **`Tag`**      | Same shape — a 5-value `color` prop including all three status colors, zero icon references.                                                                                         |
| **`Timeline`** | `.marker[data-color=…]` was a bare colored dot with no shape variation — the clearest failure of the three, since the marker _is_ the encoding.                                      |

These are exactly the components a consuming app reaches for to show status
compactly — a list of build results, a row of environment tags, a deployment
timeline. The highest-frequency place a red/green distinction appears, and the
one place it carried no redundancy.

## The fix, as shipped

1. **`Badge` / `Tag`** — a status `color` now defaults to the shared
   `AlertVariantIcon` glyph plus a `VisuallyHidden` status word. Two channels,
   because they solve different problems: the glyph is for sighted readers who
   can't separate the hues, the hidden word for screen readers, which get no
   color at all. `neutral`/`brand` are untouched — they make no status claim.

   The escape hatch is `icon={false}`, for labels that already name the status
   (`<Badge color="danger" icon={false}>Failed</Badge>`). Deliberately an
   opt-**out**: an opt-in prop would have left the defect in place for everyone
   who didn't know to reach for it.

2. **`Timeline`** — status markers now differ in silhouette: success stays a
   circle, warning becomes a triangle, danger a square. Skipped when a custom
   `icon` is supplied, since that is already a non-color channel. No hidden
   label here — a timeline item carries its own `time`/`title`/`children`, so
   the marker color is supplementary rather than the sole signal.

## Still outstanding: the lint rule

Nothing mechanically enforces this. A component added tomorrow can reintroduce
the defect silently, and the Foundation is relying on a promise that nothing
verifies. The check: flag any component whose only differentiator across a
semantic status set is a `--ds-color-status-*` value.

The Foundation owner's warning about `secondaryEncoding` applies symmetrically
— it must not become the flag reached for to turn a red build green.

---

# Part E — Open with the Foundation

**This document has not been delivered yet.** Only `CHART_TOKEN_REQUIREMENTS.md`
reached the Foundation owner, which is why nothing in Parts A–C has a response.
They have confirmed they will work it the same way once sent.

## Awaiting a Foundation decision

| Item                                            | Blocking                                            | Note                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **A5 — disabled opacity: 0.38 or 0.6?**         | **C2** (19 occurrences across 17 components)        | The library currently contradicts the Foundation's own documented value. Nothing moves until this is settled. |
| A1 — focus ring tokens                          | 40 hand-rolled occurrences across 30 files          | Highest-impact item in this audit; no response yet.                                                           |
| A2/A3 — loop + reduced-motion durations         | 5 occurrences                                       | Low urgency.                                                                                                  |
| A4 — contrast ring for arbitrary-color surfaces | `ColorPicker`, future eyedropper/cropper/map-marker | Low urgency.                                                                                                  |

Two Foundation properties constrain how any of the above should be proposed —
both recorded in `CLAUDE.md`: OKLCH `L` is constant across all 15 families at
each step (so hue alone can never be the sole differentiator in a token
proposal), and high-contrast retains hue in 22 of 40 roles (so a new role that
carries meaning through hue should keep it there, not strip it).

The Foundation's `scripts/validate-palette.mjs` has landed. It is worth
adopting beyond charts — the only mechanical check that catches a status or
accent color drifting into an unreadable pairing.

---

# Suggested sequencing

1. **A1 focus ring** — highest impact, unblocks a 40-occurrence cleanup and
   fixes a real forced-colors accessibility inconsistency.
2. **A5 + C2 disabled opacity** — needs a decision (0.38 vs 0.6) before any
   code moves; the current state has the library contradicting the Foundation.
3. **B1 border-width mapping** — pure win, no upstream dependency, and a
   prerequisite for the chart track.
4. **C1 reset.css fallbacks** — one-line fix, do it whenever.
5. **A2/A3 motion, A4 contrast ring** — low urgency, batch into the next
   Foundation release.
6. **Chart roles** — separate track, see `CHART_TOKEN_REQUIREMENTS.md`.

**Done:** Part F (`Badge`/`Tag`/`Timeline` secondary encoding). Its remaining
piece is the lint rule that keeps the guarantee true for components added
later.

## Reproducing this audit

```bash
# A: --ds-* used but never defined  /  defined but unused
grep -rhoE "var\(--ds-[a-z0-9-]+" src/ --include=*.css --include=*.tsx | sed 's/var(//' | sort -u > used.txt
grep -hoE "^\s*--ds-[a-z0-9-]+:" src/styles/variables.css | tr -d ' :' | sort -u > defined.txt
comm -23 used.txt defined.txt   # used, undefined
comm -13 used.txt defined.txt   # defined, unused

# C: variables.css pointing at a Foundation token that doesn't exist
grep -rhoE "var\(--(semantic|color|spacing|radius|font|size|motion|border|z|grid|aspect|elevation)[a-z0-9-]*" src/styles/variables.css | sed 's/var(//' | sort -u > fref.txt
grep -rhoE "^\s*--[a-z0-9-]+:" node_modules/@mellon-design/tokens-web/css/*.css | tr -d ' :' | sort -u > fdef.txt
comm -23 fref.txt fdef.txt

# D/F: raw literals and contract violations in components
grep -rnoE "#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)" src/components --include=*.module.css
grep -rnE "var\(--(semantic|color|spacing|radius|font|size|motion|border)-" src/components
grep -rnoE "var\(--ds-[a-z0-9-]+,[^)]+\)" src/ --include=*.css --include=*.tsx
```

Note the `--ds-space-` hit from `src/utilities/resolveSpace.ts:8` is a false
positive — a template literal (`var(--ds-space-${value})`) guarded by a
`SPACE_TOKENS` allow-list.
