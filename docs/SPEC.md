# React + TypeScript Design System Component Library Specification

> Source of truth for scope and architecture decisions. If code and this
> document disagree, open a PR to reconcile them — don't just pick one.

## Objective

Design and build a **production-grade, enterprise-ready React + TypeScript
component library** that will eventually consume tokens from a separate
**Design System Foundation** repository.

The Design System Foundation is being developed independently and will
become the single source of truth for all design tokens (colors,
typography, spacing, motion, radius, elevation, etc.).

Rather than waiting for the Foundation to be completed, this library was
built starting with placeholder design tokens via CSS variables. That token
package — `@mellon/tokens-web` — now exists and is linked in locally (see
"Future Token Integration"), ahead of its npm publish, so components already
render with real values while the integration path stays the same either
way: updating the styling layer only, never component logic.

## Technology Stack

- React 19+, TypeScript (strict mode)
- Vite (library mode), Storybook, Vitest, React Testing Library
- ESLint, Prettier, Changesets, pnpm
- Styling: CSS Variables + CSS Modules. Avoid runtime-heavy CSS-in-JS.

The library must be tree-shakeable, SSR compatible, RSC compatible where
appropriate, and framework agnostic (Next.js, Remix, Astro, etc.).

## Repository Structure

```text
react-design-system/
├── src/
│   ├── components/
│   ├── hooks/
│   ├── contexts/
│   ├── providers/
│   ├── styles/
│   ├── utilities/
│   ├── icons/
│   ├── animations/
│   ├── types/
│   └── index.ts
├── stories/
├── tests/
├── docs/
├── scripts/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .storybook/
└── README.md
```

Single package, single responsibility — no `packages/` monorepo layout
unless this library is later split into multiple published npm packages.

Each `src/` directory has one job. Every component under `src/components/`
owns its implementation, styles, tests, stories, and exports:

```text
components/Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
├── Button.stories.tsx
└── index.ts
```

## Styling Strategy

Never hardcode design values. Reference `--ds-*` CSS variables, with a
fallback value:

```css
background: var(--ds-color-surface-primary, #ffffff);
color: var(--ds-color-text-primary, #111111);
padding: var(--ds-space-md, 1rem);
border-radius: var(--ds-radius-md, 0.5rem);
```

`src/styles/variables.css` maps every `--ds-*` name to the real
`@mellon/tokens-web` tokens (imported from the package, currently linked
locally — see "Future Token Integration"). Component code never changes
when that mapping changes, which is the entire point of the indirection —
keep referencing `--ds-*`, never a token name directly. Motion values
follow the same rule — never hardcode a duration or easing curve:

```css
transition: var(--ds-motion-duration-medium) var(--ds-motion-easing-standard);
```

**Variant props** (a component's `size`/`variant`/`color`/etc., as opposed
to arbitrary values like spacing) are applied as `data-*` attributes, not
modifier classes — e.g. `<button data-variant="primary" data-size="md">`
with CSS targeting `.button[data-variant='primary']`. Each axis stays an
independent prop with its own small CSS block instead of combinatorial
class names (`variantPrimarySizeMdDisabled`), and the rendered DOM is
self-documenting in devtools. See `Text`/`Heading` for the reference
implementation.

## Component Design Principles

Components must be composable, accessible, strongly typed, performant,
minimal, reusable, themeable, responsive, and SSR compatible. They must
support controlled and uncontrolled usage, ref forwarding, polymorphic
rendering where appropriate, keyboard navigation, RTL, and dark mode.
Favor composition over large prop APIs.

Theme switching (light/dark/high-contrast) is handled by `ThemeProvider`
and `useTheme` (`src/providers`, `src/hooks`) — they apply `data-theme` to
`document.documentElement`, which is what the Foundation's theme CSS
targets. Components should never read the theme directly to branch
rendering logic; let CSS variables do that.

`ref` forwarding isn't universal where it doesn't make sense: `Portal`
relocates its children into another DOM location rather than rendering an
element of its own, so it has no root node to forward a ref to.

## Build Order

Build in **dependency order, not alphabetical order**:

1. **Core Primitives** — `Box`, `Flex`, `Grid`, `Stack`, `Text`, `Heading`, `Portal` ✅ shipped
2. **Foundation Components** — `Button`, `Input`, `Field`, `Card` ✅ shipped
3. **Composite Components** — `Tabs`, `Dialog`, `Dropdown`, `Table`, `DatePicker` ✅ shipped
4. **Shared Infra** — `Popover`, `usePointerDrag`, `useRovingFocus`, `usePositioning` virtual-reference support, `dateGrid.ts`, `HelperText`/`ErrorMessage` ✅ shipped (see "Shipped Phase Notes" below for details)
5. **Presentational Fill-Ins** — 33 components across Foundations/Typography/Data Display/Feedback/Form/Media ✅ shipped (see "Shipped Phase Notes" below for the full list and notes)
6. **Popover + First Consumers** — `Tooltip`, `HoverCard`, `SplitButton` ✅ shipped (see "Shipped Phase Notes" below for details)
7. **Menus & Roving-Focus Groups** — `IconButton`, `FloatingActionButton`, `ButtonGroup`, `ToggleButton`, `RadioGroup`, `Menu`, `ContextMenu` ✅ shipped (see "Shipped Phase Notes" below for details)
8. **Simple Field Controls** — `TextArea`, `PasswordField`, `SearchField`, `NumberField`, `EmailField`, `PhoneField`, `Checkbox`, `Switch` ✅ shipped (see "Shipped Phase Notes" below for details)
9. **Closed-Set Selects** — `Select`, `MultiSelect`, `TimePicker` ✅ shipped (see "Shipped Phase Notes" below for details)
10. **Combobox & Autocomplete** — `Combobox`, `Autocomplete` ✅ shipped (see "Shipped Phase Notes" below for details)
11. **Drag-Based Inputs** — `Slider`, `RangeSlider`, `Rating` ✅ shipped (see "Shipped Phase Notes" below for details)
12. **Segmented Inputs** — `OTPInput`, `PinInput` ✅ shipped (see "Shipped Phase Notes" below for details)
13. **Overlay Family** — `Drawer`, `Dialog` enhanced with `Header`/`Body`/`Footer` + a `size` prop ✅ shipped (see "Shipped Phase Notes" below for details)
14. **Global Feedback Surfaces** — `Toast`/`ToastProvider`/`useToast` (covers Snackbar), `Alert`, `Banner`, `LoadingOverlay` ✅ shipped (see "Shipped Phase Notes" below for details)

**5 phases remain: Phase 15 through Phase 19** (see "Planned: Phase 15 and beyond" below).

Phase 2 introduced the library's first stateful/interactive components and
two shared building blocks later Form components should reuse rather than
reinvent:

- **`useControllableState`** (`src/hooks`) — the standard controlled/
  uncontrolled value pattern (`Input`, `Dialog`, `Dropdown` all use it;
  `Checkbox`, `Switch`, `RadioGroup`, `Select`, etc. will too).
- **`FieldContext`/`useFieldContext`** (`src/contexts`, `src/hooks`) — how
  `Field` wires `id`/`aria-describedby`/`aria-invalid`/`required`/
  `disabled` onto whatever control it wraps. Context, not `cloneElement`:
  `cloneElement` only works with exactly one direct child and isn't
  type-safe, and every later Form control (`Checkbox`, `Select`, `TextArea`,
  `RadioGroup`, ...) needs to plug into the same mechanism `Field` provides,
  which context supports and `cloneElement` doesn't. Any control meant to
  be usable inside a `Field` should call `useFieldContext()` and fall back
  to managing its own `id` (`useId()`) when there's no ancestor `Field`,
  the way `Input` does.

Phase 3 built out the overlay/composite-widget infra every later
interactive component (`Popover`, `Select`, `Combobox`, `Menu`, `Tooltip`,
`DatePicker`, ...) should reuse:

- **`useFocusTrap`/`<FocusTrap>`** (`src/hooks`, `src/components/FocusTrap`)
  — traps Tab/Shift+Tab within a container and restores focus on
  deactivate. `Dialog` calls the hook directly (it already owns a panel
  ref); `<FocusTrap>` is the declarative wrapper for consumers building
  custom overlays.
- **`usePositioning`** (`src/hooks`) — wraps `@floating-ui/dom`
  (`computePosition` + `flip`/`shift`/`offset`, re-computed via
  `autoUpdate`). `Dropdown.Menu` is the first consumer.
- **`useClickOutside`/`useEscapeKey`** (`src/hooks`) — `useClickOutside`
  accepts an array of refs, not just one, so a trigger element can be
  excluded alongside the panel it opens (otherwise clicking the trigger
  while open closes-then-immediately-reopens it — `Dropdown` hit this).
- **`mergeRefs`** (`src/utilities`) — combines a forwarded ref with an
  internally-needed one; `Dropdown.Trigger` uses it to attach both the
  consumer's ref and the trigger ref `usePositioning` needs.
- **Compound components**: `Tabs` and `Dropdown` are the first
  root-plus-parts components (`<Tabs.List>`, `<Dropdown.Menu>`, ...). Each
  part is its own function component; the root attaches them via
  `Object.assign(Root, { Part1, Part2, displayName: 'Root' })` (include
  `displayName` in the same `Object.assign` call — assigning it afterward
  doesn't typecheck against a `forwardRef`-cast component). Parts are also
  individually named-exported. Every later compound component (`Accordion`,
  `Menu`, `Select`, `RadioGroup`, `Breadcrumb`, ...) should follow this.
- **`Portal` was fixed**: it used to wait a tick after mount (via
  `useState`/`useEffect`) before calling `createPortal`, on the mistaken
  assumption that was needed for SSR safety. It wasn't — `document.body`
  isn't part of what React hydrates at the root, so a portal appearing on
  the first client render doesn't cause a hydration mismatch — and the
  delay raced against any consumer whose own effect depends on the
  portaled ref existing in the same commit (`Dialog`'s focus trap,
  `Dropdown`'s positioning would silently see `ref.current === null` on
  first open). `Portal` now renders synchronously; only the `typeof
document === 'undefined'` check remains for SSR.
- **`DatePicker` shipped** (its own session, as planned): a button trigger
  (not a free-text input — locale-aware date _parsing_ is a separate, much
  larger scope than the calendar grid/date math/keyboard nav this component
  covers) plus a popover panel, reusing `usePositioning`,
  `useClickOutside`/`useEscapeKey`, and `useFocusTrap` exactly like
  `Dialog`/`Dropdown` do. The day grid is `role="grid"` > `role="row"` >
  `role="gridcell"` `<div>`s (not `<button>`s) with a roving `tabIndex` (0
  on the one focused day, -1 on the rest) — a real `<button>` would match
  `useFocusTrap`'s focusable-element selector on every day regardless of
  `tabIndex`, breaking roving-tabindex arrow-key nav. Always renders a
  fixed 6-week/42-day grid (leading/trailing days from adjacent months
  included) so the panel's height never shifts between months. No
  `required` prop: neither `required` nor `aria-required` is valid on an
  element with the `button` role, so there's nowhere correct to put it —
  an ancestor `Field`'s `required` still renders its own label asterisk
  regardless.
- **`DatePicker` extended** post-launch, from user feedback that
  month-by-month navigation alone was a poor way to reach a distant date
  and that range selection was missing entirely:
  - **Month/year drill-down**: the panel now has three views (`day`
    (default) → `month` → `year`), state tracked as `view` alongside
    `focusedDate`. Clicking the heading (now a `<button>`, not a `<span>`,
    except at the top `year` level where there's nowhere further to go)
    goes up a level; clicking a month or year cell goes back down,
    re-anchoring `focusedDate`. Each view gets its own keyboard handler
    (`handleDayGridKeyDown`/`handleMonthGridKeyDown`/
    `handleYearGridKeyDown`) reusing `dateGrid.ts`'s `addMonths`/
    `addYears` for stepping — month view steps by 1/4 (Left-Right/Up-Down)
    and clamps Home/End to the year, year view steps the same way over a
    `YEAR_PAGE_SIZE`-year (12) page and clamps Home/End to the page.
    `dateGrid.ts` gained `isMonthOutOfRange`/`isYearOutOfRange` (true only
    when _every_ day in the month/year is outside `[min, max]`, so a
    month/year with some valid days stays reachable) and
    `formatMonth`/`YEAR_PAGE_SIZE`/`startOfYearPage`.
  - **`selectionMode="range"`**: a new prop (`'single'` default |
    `'range'`), with a parallel `rangeValue`/`defaultRangeValue`/
    `onRangeChange` prop set (shape `{ start: Date; end?: Date }`) used
    instead of `value`/`defaultValue`/`onChange` in range mode — not a
    discriminated-union on the existing props, to avoid fighting
    TypeScript's ergonomics for two different shapes on one prop name.
    First click sets `start` (panel stays open); second sets `end`
    (swapping the two if it lands before `start`) and closes the panel;
    clicking again after a complete range starts a new one. Range days
    get `aria-selected="true"` across the whole span (start, end, and
    everything between) for correct AT semantics, with `data-range-start`/
    `data-range-end`/`data-in-range` driving the visual distinction
    (strong brand-color endpoints, lighter secondary-surface fill
    between) — the `[data-in-range]` CSS rule is declared _after_
    `[aria-selected='true']` so it can override the strong color for
    non-endpoint days despite both matching. No live hover/focus preview
    of the in-progress range (only committed `start`/`end` are
    highlighted) — a deliberate scope cut, same spirit as skipping
    free-text parsing.

Later components compose earlier ones. `Box` ships first (see
`src/components/Box`) because every layout primitive and most foundation
components render through it.

Scaffold a new component's standard 5-file set with:

```sh
pnpm generate:component <Category> <ComponentName>
# e.g. pnpm generate:component Buttons Button
# quote multi-word categories: pnpm generate:component "Data Display" Card
```

This writes a blank polymorphic starting point matching `Box`'s
conventions (see `scripts/generate-component.mjs`) and adds the export to
`src/components/index.ts` — fill in real props/behavior from there.
Non-polymorphic, structural, or compound components (`Input`, `Portal`,
`Dialog`, `Tabs`, `Table`, ...) need manual rework after scaffolding — the
generator's default is a polymorphic single-element leaf, which is right
for most components but not all of them.

### Shipped Phase Notes (Phases 4-14)

Historical rationale for already-completed phases, kept for reference —
component lists, design decisions, and bugs found/fixed while building
each one. Skip to "Planned: Phase 15 and beyond" below for the actual
remaining roadmap.

4. **Shared Infra** ✅ shipped — new mechanisms later phases build on, not
   user-facing components (aside from `HelperText`/`ErrorMessage`):
   - `Popover` ✅ done (`src/components/Popover`) — generalizes
     `Dropdown.Menu`'s trigger+panel+positioning+dismiss logic into a
     reusable compound-component primitive:
     `<Popover><Popover.Trigger>...</Popover.Trigger><Popover.Content>...</Popover.Content></Popover>`.
     `triggerMode="click"` (default) toggles like `Dropdown`;
     `triggerMode="hover"` opens on pointer hover or keyboard focus and
     closes `closeDelay`ms (default 150) after both trigger and content
     lose hover/focus — hovering from trigger into content cancels the
     pending close, via a shared timer coordinated through context.
     Deliberately does **no** focus management (no trap, no auto-focus
     into content) — `Popover.Content` holds arbitrary children, so unlike
     `Dropdown.Menu` (always `menuitem`s) it can't safely assume what to
     focus; each future consumer (Select, Combobox, Menu, Context Menu)
     brings its own focus story on top (e.g. `useRovingFocus`). Shipped
     `Dropdown` stays untouched — `Popover` is for new consumers only.
   - `usePointerDrag` ✅ done (`src/hooks/usePointerDrag.ts`) — one hook on
     native Pointer Events for every later drag-based control: Slider,
     Range Slider, Resizable, Split Pane, Carousel, Color Picker, Scroll
     Area's thumb, Pull To Refresh, Swipe Actions. Returns `{ isDragging,
handlers }` — spread `handlers` onto the draggable element;
     `onDragMove` receives the cumulative client-pixel `{x, y}` delta from
     drag start, and mapping that to a value range is the consumer's job.
     `setPointerCapture`/`releasePointerCapture` are feature-detected
     (both undefined in jsdom, confirmed while building this) rather than
     called unconditionally, so unit tests can simulate a drag by
     dispatching pointer events directly on the element — real capture-
     across-bounds behavior is a `pnpm test:storybook`-only concern, same
     split as the rest of the "Testing/environment gaps" list below.
   - `useRovingFocus` ✅ done (`src/hooks/useRovingFocus.ts`) — generalizes
     the linear roving-tabindex keyboard nav that `Tabs.List` and
     `Dropdown.Menu` each hand-roll separately, before a third and fourth
     copy show up in Menu, RadioGroup, ToggleButton groups, Context Menu,
     Accordion. Takes an `itemSelector`, `orientation`
     (`horizontal`/`vertical`/`both`), `wrap`, and an optional `onNavigate`
     — present for "automatic activation" consumers like `Tabs.List`
     (moving focus also selects), omitted for "manual activation" ones
     like a menu (Enter/Space/click selects separately). Returns an
     `onKeyDown` handler; each item still owns its own `tabIndex`. Shipped
     `Tabs`/`Dropdown` were **not** refactored onto it (regression risk on
     shipped code for no user-facing gain) — it's for new consumers only.
   - `usePositioning` ✅ done — extended to accept a
     `PositioningReference`: either the original `RefObject<Element |
null>` or a floating-ui `VirtualElement` (just a
     `getBoundingClientRect()`), so a future Context Menu can position at
     a click point instead of an element. Existing `Dropdown`/`DatePicker`
     call sites are unaffected (positional args, same runtime behavior for
     the `RefObject` path).
   - `src/utilities/dateGrid.ts` ✅ done — extracts `DatePicker.tsx`'s pure
     date math (`buildMonthGrid`, `addDays`/`addMonths`/`addYears`,
     `isSameDay`, `isOutOfRange`, `formatMonthYear`/`formatFullDate`,
     `WEEKDAY_LABELS`, `toDateKey`) so Calendar and Date Range Picker
     (Phases 15, 17) don't fork it by copy-paste; `DatePicker.tsx` now
     imports from it instead of defining these inline. Whether the grid
     _rendering_ (JSX/keyboard-nav) is also shared is still an open
     decision for Phase 15, not resolved here — only the math moved.
   - `HelperText`/`ErrorMessage` ✅ done — extracted out of `Field`'s
     inline rendering (`src/components/Field/Field.tsx` used to inline
     this as a raw `<div>` + ternary); both are simple polymorphic leaves
     (`as` prop, default `div`) following `Text`'s pattern. `ErrorMessage`
     deliberately has no `role="alert"` by default — `Field` wires it via
     `aria-describedby`, which screen readers already announce on focus,
     so a live region on top would double-announce it; consumers who need
     an immediate announcement (e.g. after an async submit) should wrap it
     in their own live region. `Field` now composes both instead of
     duplicating their styles — `Field.module.css` no longer has its own
     `.helperText`/`.errorMessage` rules.
5. **Presentational Fill-Ins** ✅ shipped — Inline, Spacer, Container,
   Center, AspectRatio, VisuallyHidden, Display, Label, Paragraph,
   Caption, Code, Link, Blockquote, List, ListItem, Avatar, AvatarGroup,
   Badge, Chip, Tag, Statistic, EmptyState, KeyValueList, Skeleton,
   Spinner, Progress, CircularProgress, Fieldset, FormGroup, FormSection,
   Image, Figure, Divider (33 components) — no state/overlay/drag, pure
   `Box`/`Flex`/`Text` composition. `Label` is one component, used by both
   Typography and Form. A few notable decisions made while building this
   batch:
   - **Typography leaves reuse `Text`'s CSS directly**, the same pattern
     `Heading` already established (`import textStyles from
'../Text/Text.module.css'`, not composing `<Text>` as a JSX child) —
     `Display`, `Label`, `Paragraph`, `Caption`, `Link`, `Blockquote`,
     `ListItem` all do this. `Display` needed its own `data-display-size`
     scale (`sm`/`md`/`lg`, `calc()` off `--ds-font-size-xl`) instead of
     reusing `Text`'s `data-size`, since it needs bigger sizes than that
     scale has.
   - **`ListItem` got its own `src/components/ListItem/` directory**, not
     nested under `List/` — every named inventory item is its own
     directory even when two components are always used together (same
     precedent as `Card`/`Table` being siblings, not one nesting the
     other).
   - **`Badge`/`Chip`/`Tag` are deliberately different**, not three skins
     on one component: `Badge` is a static status/count pill (no
     interaction), `Chip` is removable (has an "×" button and
     `onRemove`), `Tag` is a static categorization label that can render
     as a link (`as="a"`) for a clickable filter use case. `Badge`'s
     "subtle" variant uses a neutral secondary-surface background with
     colored text rather than a tinted background — this token set has no
     separate tinted-background scale per status color, only the
     full-strength ones `variant="solid"` uses.
   - **`Avatar`'s initials fallback puts the accessible name on the
     wrapper** (`role="img"` + `aria-label`), not the visible initials
     text (which is `aria-hidden`) — otherwise both would be announced.
     `AvatarGroup` wraps each child (and the "+N" overflow indicator) in a
     plain `<span>` for the overlap/border styling, rather than reaching
     into `Avatar`'s own CSS-module class from outside (fragile — CSS
     Modules' generated class names aren't a stable cross-component API).
   - **`AvatarGroup` hit the same `forwardRef` + required-own-prop generic
     issue `Heading` already worked around** (documented there) — because
     `children` is required on `AvatarGroupOwnProps`, and needed the same
     render-function-cast fix.
   - **`Progress`/`CircularProgress` omit `aria-valuenow` when
     indeterminate** (no `value` prop) rather than fabricating one — valid
     per the ARIA `progressbar` spec and doesn't trip axe's
     required-attribute check.
   - **`Image`'s `alt` is required at the type level** (`Omit<... , 'alt'>
& { alt: string }`), unlike native `<img>` where it's optional —
     forces callers to pass `alt=""` explicitly for decorative images
     rather than silently omitting it. Needed an explicit
     `alt={alt}` JSX attribute rather than passing it through `...rest`,
     since `jsx-a11y/alt-text` can't statically see an attribute hidden
     inside a spread.
6. **Popover + First Consumers** ✅ shipped — `Popover` was already public
   (shipped in Phase 4); this phase built its first real consumers:
   - **`Tooltip`** — deliberately **not** built on `<Popover>` JSX, despite
     both being hover/focus-triggered: `Popover.Trigger` hardcodes
     `aria-haspopup="dialog"`/`aria-expanded`/`aria-controls`, the _popup_
     pattern, which is wrong for a tooltip (correct wiring is
     `aria-describedby` on the trigger pointing at `role="tooltip"`
     content, no `aria-expanded`/`aria-haspopup` at all). Reuses
     `Popover`'s underlying pieces directly instead — `usePositioning`,
     `useEscapeKey`, `useControllableState`, and the same open/
     close-with-delay timer pattern — to stay ARIA-correct rather than
     forcing it through `Popover.Trigger`'s semantics. `Tooltip` clones
     its single `children` element (`cloneElement`, merging in a ref,
     hover/focus handlers, and `aria-describedby`) instead of wrapping it
     in a new element, so it attaches to whatever you already have (an
     icon, a disabled button, an `<abbr>`) rather than requiring a
     `Popover`-style "trigger renders itself as this element" API.
   - **`HoverCard`** — the opposite call: a hover card's trigger is
     naturally already a real interactive element (a link, an `@mention`),
     so `Popover.Trigger`'s popup semantics are _correct_ here, not a
     mismatch. `HoverCard` is a thin `Popover` preset —
     `HoverCard.Trigger`/`HoverCard.Content` _are_ `Popover.Trigger`/
     `Popover.Content` (the same component references, re-exported), with
     `triggerMode="hover"` and a longer default `closeDelay` (300ms vs
     `Popover`'s 150) baked in, since hover-card content is more often
     itself interactive (a link/button inside the card) and needs more
     time to move the pointer into it. No `HoverCard.module.css` — it
     introduces zero new styling, 100% reusing `Popover`'s.
   - **`SplitButton`** — composes `Button` + `Dropdown` directly rather
     than reimplementing either: `Dropdown.Trigger` renders `as={Button}`
     (polymorphic `as` accepts a component, not just a tag name), so the
     chevron gets `Button`'s variant/size styling and `Dropdown`'s
     existing open/close/keyboard-nav for free. The two buttons are
     visually joined (shared height, no gap, only outer corners rounded)
     via `.splitButton .primary`/`.splitButton .chevron` selectors — two
     classes, not one, so the override reliably beats
     `Button.module.css`'s single-class `.button` rule regardless of
     which CSS module happens to load first (same-specificity rules are
     otherwise import-order-dependent, an easy silent bug with this kind
     of cross-component CSS override).
7. **Menus & Roving-Focus Groups** ✅ shipped — `IconButton`,
   `FloatingActionButton`, `ButtonGroup`, `ToggleButton`, `Radio`+
   `RadioGroup`, `Menu`, `ContextMenu`:
   - **`IconButton`/`FloatingActionButton` reuse `Button.module.css`
     directly** (`import buttonStyles from '../Button/Button.module.css'`),
     the same cross-component CSS pattern `Display`/`Label`/etc. established
     reusing `Text`'s — not a new button skin. Both needed the
     `ForwardRefRenderFunction`-cast workaround (documented at `Heading`/
     `AvatarGroup`) since `'aria-label'` is a required own prop, which
     breaks `forwardRef`'s generic inference otherwise. `IconButton.module
.css`'s overrides use doubled-class selectors
     (`.iconButton.iconButton[data-size=...]`) so they reliably beat
     `Button.module.css`'s equal-specificity `[data-size]`/`[data-variant]`
     rules regardless of which CSS module happens to import first — same
     import-order hazard `SplitButton` hit in Phase 6.
     `FloatingActionButton` is always a circle with elevation shadow, plus
     an optional `fixed` prop for viewport-corner positioning.
   - **`ButtonGroup`** is the first real `useRovingFocus` consumer. Wraps
     each `Button` child in a plain `<div className={styles.item}>` rather
     than touching `Button`'s own classes — sidesteps the CSS-specificity
     problem entirely instead of needing doubled-class overrides. Tracks
     `activeIndex` via a container-level `onFocus` handler, not
     `useRovingFocus`'s `onNavigate` — `onNavigate` only fires on arrow-key
     moves, so a _click_ on a button would never update `activeIndex`;
     `onFocus` covers both, since the hook calls `.focus()` synchronously
     before `onNavigate` anyway. `Menu` reuses this same `onFocus`-tracking
     template below.
   - **`ToggleButton`** also reuses `buttonStyles.button` directly, plus
     `useControllableState` for `pressed`/`aria-pressed`, with a doubled-
     class override for the pressed-highlight color (same specificity
     hazard as `IconButton`).
   - **`RadioGroup`** is a compound `RadioGroup`+`RadioGroup.Radio` (also
     named-exported as `Radio`) built on custom `role="radiogroup"`/
     `role="radio"` `<div>`s rather than native `<input type="radio">` —
     deliberate, to exercise `useRovingFocus` rather than get native
     radio-group keyboard nav for free. Uses "automatic activation" (arrow
     keys both move focus _and_ select, via `useRovingFocus`'s
     `onNavigate`), unlike `Menu`'s "manual activation" below — the
     correct split per the WAI-ARIA APG distinction between a radio group
     and a menu. `useControllableState`'s `onChange` type includes
     `undefined` in its parameter, requiring a small wrapper
     (`(next) => { if (next !== undefined) onValueChange?.(next); }`)
     rather than passing `onValueChange` straight through.
   - **`Menu`+`MenuItem`** is a standalone `role="menu"`/`role="menuitem"`
     list with real roving tabindex, unlike `Dropdown.Menu` (which
     permanently sets `tabIndex={-1}` on every item and moves focus purely
     via `.focus()` calls — fine there because Tab always closes that
     menu, wrong for a menu that can be displayed statically, e.g. a future
     sidebar, which needs a stable Tab stop like any other widget). Uses
     "manual activation" — arrow keys only move focus, Enter/Space/click
     select separately — deliberately does **not** auto-focus an item on
     mount, since `Menu` can't tell whether it's rendered statically
     (where stealing focus would be disruptive) or freshly mounted inside
     an overlay (where it usually should be); consumers needing "focus
     first item on open" — like `ContextMenu` — handle it themselves.
   - **`ContextMenu`** opens `Menu` at the pointer's coordinates on
     right-click rather than relative to a trigger element — the reason
     `usePositioning` gained `PositioningReference`/virtual-element support
     in Phase 4, unused by any shipped component until now. No controlled
     `open`/`onOpenChange` API: a context menu's existence is defined by
     _where_ the triggering right-click happened, not something an
     external controller can meaningfully supply — right-clicking again
     while already open just repositions it. Two real bugs surfaced and
     were fixed while building this, both worth flagging for any future
     component with similar shape:
     - **Neither `Children.map` nor `Children.toArray` unwraps a literal
       `<>...</>` fragment** — both treat it as a single opaque child, not
       the elements inside it. Since `ContextMenu`'s `menu` prop (and any
       props-that-aren't-`children` holding a list of elements) is most
       naturally authored as a JSX fragment, `cloneElement`ing or
       tabIndex-injecting over a naive `Children.toArray(menu)` silently
       targets the fragment wrapper instead of its children (invalid
       props like `onSelect` land on `React.Fragment`, which warns and
       drops them; injected `tabIndex`/`data-menu-item` never reach the
       real items). Fixed with a new recursive helper,
       `flattenChildren` (`src/utilities/flattenChildren.ts`), that
       expands fragments (and arrays) before filtering/cloning — used by
       both `Menu.tsx` (replacing its `Children.toArray(children)`) and
       `ContextMenu.tsx`. `AvatarGroup`/`ButtonGroup`/`RadioGroup` still
       use the naive pattern and would hit the same bug if a consumer ever
       passed them fragment-wrapped children — untested so far since none
       currently does, worth revisiting if one does.
     - **An unstable virtual-element object reference caused a runaway
       `usePositioning` loop**: the click-point `VirtualElement` passed to
       `usePositioning` was a fresh object literal created on every
       render. Since `usePositioning`'s effect depends on that
       reference's identity, a new object every render tore down and
       re-subscribed its `autoUpdate` every render — including the
       renders `autoUpdate` itself triggers via `setPosition` after
       `computePosition()` resolves — free-running in a tight reactive
       loop. Invisible in jsdom (confirmed live in a real headless
       Chromium session: 700+ `ResizeObserver.observe` calls within
       500ms of opening, climbing further at idle, eventually starving
       the render thread enough to hang keyboard input entirely). Fixed
       by memoizing the virtual element with `useMemo` keyed on the click
       coordinates, so its identity is stable unless the click point
       actually changes.
     - Also worth noting from live verification (unrelated to either bug
       above): a **real right-click** (`mouse.down`/`mouse.up` with
       `button: 'right'`, or the Playwright `button: 'right'` click
       option) hangs indefinitely in headless Chromium **on Windows** —
       it tries to invoke the native OS context menu, which has no UI to
       respond to in headless mode. Verifying `ContextMenu` in a scratch
       Playwright script needs a synthetic `element.dispatchEvent(new
MouseEvent('contextmenu', {...}))` instead, which exercises the
       same React `onContextMenu` handler without touching Chromium's
       native menu machinery at all. Not a bug in the component — a
       Windows-headless-Chromium environment quirk to route around in any
       future live-verification script that needs to simulate a
       right-click.
8. **Simple Field Controls** ✅ shipped — `TextArea`, `PasswordField`,
   `SearchField`, `NumberField`, `EmailField`, `PhoneField`, `Checkbox`,
   `Switch`:
   - **`TextArea`** reuses `Input.module.css`'s `.input` box styling
     directly (border/focus-ring/disabled/size scale), the same
     cross-component CSS pattern established since Phase 5 — its own
     `TextArea.module.css` only adds `resize`/`min-height`.
   - **`EmailField`/`NumberField`** are genuinely thin: each composes
     `Input` directly (not just its CSS) with a fixed `type` spread
     _after_ `...props` so a consumer can't override it, no other logic.
     No custom stepper UI on `NumberField` — same free-text-parsing scope
     cut already accepted for `DatePicker`. `PhoneField` started this way
     too (see "`PhoneField` extended" below for why it no longer is).
   - **`PasswordField`** is the one non-trivial wrapper: a show/hide
     toggle needs its own `visible` state, so it wraps `Input` in a
     positioned `<div>` rather than composing it inline. Lets `Input`
     handle all `useFieldContext`/`id`/`invalid`/`disabled` resolution
     itself rather than duplicating it. The toggle is a plain `<button>`
     with a small inline SVG eye icon (no icon library exists in this
     project — same "plain glyph/inline SVG" precedent as `DatePicker`'s
     `‹`/`›` nav and `Chip`'s `×` remove button), not `IconButton` —
     `IconButton` composes `Button`'s padding/min-size CSS, which doesn't
     fit sitting inside an input's own box the way it needs to here.
   - **`SearchField`** needs to know the current value (to decide whether
     to show the clear button and to reset it on click), so unlike the
     pure-passthrough fields it owns `useControllableState` itself and
     always renders `Input` in controlled mode underneath — the same
     shape `Input.stories.tsx`'s `Controlled` story already demonstrates.
     The browser's own native `type="search"` clear affordance
     (`::-webkit-search-cancel-button`) is suppressed via CSS so it
     doesn't visually double up with the custom one.
   - **`PasswordField`/`SearchField`'s padding-reservation CSS hit the
     same cross-component specificity hazard as `IconButton`/
     `SplitButton`**: a single `.input` override loses to
     `Input.module.css`'s `.input[data-size='...']` (class+attribute
     specificity) regardless of intent, tying or losing depending on
     import order. Fixed the same way — a doubled/nested selector
     (`.wrapper .input.input`) that reliably outranks it.
   - **`Checkbox`/`Switch`** are real `<input type="checkbox">`s (`Switch`
     additionally gets `role="switch"`), not custom `role="checkbox"`
     divs — unlike `RadioGroup`'s deliberately-custom `role="radio"` divs,
     there's no roving-focus-group concern motivating reinventing native
     keyboard handling and form submission here, so native wins outright.
     Both hide the real input using `VisuallyHidden`'s CSS module
     (imported directly, the established cross-component CSS-reuse
     pattern) and drive an adjacent visual `<span>` via
     `:checked`/`:indeterminate`/`:focus-visible` sibling selectors — the
     real input stays focusable and keyboard-operable, only visually
     replaced. `indeterminate` has no HTML attribute, only a JS property,
     so `Checkbox` applies it imperatively via a ref effect merged with
     the forwarded ref through `mergeRefs`; also sets `aria-checked="mixed"`
     explicitly for AT that doesn't otherwise expose the DOM property.
     Verified live (not just in jsdom) that clicking the _visible_ track/
     box — not the intentionally-hidden native input — correctly toggles
     both, via the native `<label>` click-forwarding both are built on;
     Playwright's own `locator.click()` actionability check refuses to
     click the hidden input directly (correctly — it's not what a real
     user would click), which is a testing-script detail to route around
     (click the label/visible content instead), not a component bug.
   - **`PhoneField` extended** post-launch, from a request to add a
     country dial-code selector: composes `Dropdown` directly for the
     selector button + menu (`src/components/Dropdown/Dropdown.tsx`) —
     the same "reuse an existing overlay primitive rather than
     reimplement" call `SplitButton` already made for its own chevron
     menu, since `Select`/Combobox proper are still Phase 9/10, not
     shipped yet. New `countryCode`/`defaultCountryCode`/
     `onCountryCodeChange` props are a **separate** piece of controllable
     state from `value`/`onChange` — picking a country never folds the
     dial code into the typed value (no "+1 5551234567" string-building),
     so existing `PhoneField` consumers' `value`/`onChange` contract is
     unchanged. `hideCountrySelect` opts back into the original plain
     `type="tel"`-only shape. The country list
     (`src/components/PhoneField/countryCodes.ts`) deliberately has no
     flag emoji — Windows (this project's dev environment) renders
     regional-indicator emoji as plain two-letter boxes instead of actual
     flags, so a flag-based trigger would look broken there; dial code +
     country name text only, same "plain glyph over unreliable graphics"
     call as `DatePicker`'s `‹`/`›` and `Chip`'s `×`. Also ~70 common
     countries, not the full ~195 — kept short enough to browse via
     `Dropdown.Menu`'s existing Arrow/Home/End keyboard nav with no
     search box, since adding search would start overlapping with the
     Combobox this library already defers to its own session (Phase 10).
9. **Closed-Set Selects** ✅ shipped — `Select`, `MultiSelect`,
   `TimePicker`:
   - **`Select`** implements the ARIA APG "select-only combobox" pattern —
     a `role="combobox"` trigger (`aria-haspopup="listbox"`,
     `aria-expanded`, `aria-controls`) opening a `role="listbox"`/
     `role="option"` panel — deliberately _not_ `Dropdown.Menu`'s
     `role="menu"`, the wrong pattern for a form control (a menu triggers
     actions; a listbox picks a value). Composes `Popover` for
     positioning/dismissal, but owns `open` state itself (passed in as
     `Popover`'s controlled `open`/`onOpenChange` props) rather than
     relying on `Popover`'s internal state — selecting an option needs to
     close the panel from inside `Select`'s own click handler, which is
     outside what `Popover.Trigger`/`Popover.Content` expose. `Popover
.Trigger` hardcodes `aria-haspopup="dialog"`, but — unlike `Tooltip`,
     which avoided `Popover.Trigger` entirely for this reason — it's
     safely overridable here: `{...rest}` spreads _after_ the hardcoded
     defaults, so passing `aria-haspopup="listbox"` explicitly wins.
     `Popover.Content` itself carries no role (it's just the positioned/
     portaled wrapper, and has no `onKeyDown` passthrough besides); the
     actual `role="listbox"` element with the keydown handler is nested
     _inside_ it — the same "own semantic element inside a generic
     overlay wrapper" shape `ContextMenu` uses for `Menu` inside its own
     portal. `activeIndex` state + a container `onFocus` handler is the
     same roving-tabindex template `Menu`/`ButtonGroup` established. No
     typeahead (jump-to-option-by-typing-a-letter) — a scope cut in the
     same spirit as `DatePicker`'s free-text-parsing punt. The trigger
     reuses `Input.module.css`'s `.input` box styling on a `<button>`,
     same cross-component CSS pattern as `TextArea`.
   - **`MultiSelect`** is `Select`'s sibling, reusing `Select.module.css`
     directly (own CSS module only adds the selected-option checkmark)
     rather than duplicating the trigger/listbox/option styling. The one
     behavioral difference: picking an option toggles it in/out of the
     `value` array and leaves the listbox open
     (`aria-multiselectable="true"`) instead of closing, since picking
     several is the point.
   - **`TimePicker`** is a thin wrapper generating a `Select` option list
     of times-of-day at a fixed `step` (minutes) — not a separate
     implementation, since a time picker over a closed set of increments
     _is_ a `Select` once the option list exists. `value`/`onChange`/
     `defaultValue` are always the unambiguous 24-hour `"HH:MM"` string;
     `use12Hour` only changes the displayed label (`"2:30 PM"` vs
     `"14:30"`), never the stored value.
10. **Combobox & Autocomplete** ✅ shipped — `Combobox`, `Autocomplete`,
    its own dedicated session (like `DatePicker` was out of Phase 3), and
    genuinely so — not just a bigger `Select`:
    - **`Combobox`** implements the ARIA APG "combobox with list
      autocomplete" pattern: an editable `role="combobox"` text input
      (`aria-autocomplete="list"`, `aria-expanded`, `aria-controls`,
      `aria-activedescendant`) filtering a `role="listbox"`/`role="option"`
      panel as the user types. This is materially different from
      `Select`'s pattern, not a variant of it — real DOM focus has to stay
      in the text input the entire time (so typing keeps working), so the
      "currently highlighted" option is tracked via `aria-activedescendant`
      - an `activeIndex` state and a `data-active` attribute instead of
        `Select`'s roving-tabindex-per-option (which moves real focus onto
        each option — exactly what can't happen here). Composes `Popover` the
        same way `Select` does (controlled `open` state, `Popover.Trigger`
        rendered `as="input"` with `aria-haspopup` overridden to `"listbox"`
        — safely overridable per `Select`'s established precedent and
        CLAUDE.md's design-token/no-nested-boxes rules this session also
        added). Options use `onMouseDown={(e) => e.preventDefault()}` so a
        click-to-select doesn't race a blur-triggered revert. Filtering
        doesn't kick in immediately on open — clicking or focusing an input
        that already has a value (e.g. a previous selection) shows the
        _full_ list first, tracked via an `isFiltering` flag that only flips
        on an actual keystroke, matching how most real combobox
        implementations behave rather than narrowing to self-matches of the
        existing text. `value`/`onChange` only change when the user actually
        selects a listed option (`allowFreeText` defaults to `false`);
        typing without selecting reverts the displayed text to the last
        committed value on blur/Escape. One real bug found and fixed while
        building this: `Popover.Trigger`'s own click handler unconditionally
        toggles `open`, but this trigger is _also_ opened on focus — since a
        click both focuses and clicks an unfocused input in one gesture, and
        `userEvent` (matching real browsers) commits the focus-triggered
        `open` update _before_ the click event fires, the click handler's
        stale-vs-current read of `open` caused its toggle to immediately flip
        the just-opened panel back closed. Fixed by having the input's own
        `onClick` unconditionally force `open` to `true` (never toggle) —
        since it runs after `Popover.Trigger`'s internal toggle within the
        same handler/batch, it reliably wins regardless of what that toggle
        computed.
    - **`Autocomplete`** is a thin wrapper fixing `Combobox`'s
      `allowFreeText` to `true` — the same "generate a preset, don't
      reimplement" shape `TimePicker` already used on `Select` in Phase 9.
      Whatever's typed becomes `value` immediately, no reverting on blur,
      since the option list is suggestions rather than a closed set —
      that's the actual distinction between "Combobox" (editable select)
      and "Autocomplete" (free text with suggestions) this pair captures,
      satisfying the "share ~90% of the pattern" framing from the original
      roadmap note by sharing 100% of the implementation and varying one
      flag.
    - `Element.prototype.scrollIntoView` doesn't exist in jsdom (no layout
      engine) — the keyboard-highlighted option is scrolled into view via
      `element?.scrollIntoView?.(...)` (feature-detected on the method
      itself, not just the element), the same jsdom-environment-gap
      guarding pattern already used for `setPointerCapture`/
      `releasePointerCapture` in `usePointerDrag` (Phase 4).
11. **Drag-Based Inputs** ✅ shipped — `Slider`, `RangeSlider`, `Rating`:
    - **`Slider`/`RangeSlider`** are real `role="slider"` widgets, not a
      native `<input type="range">` — a native range input can't be
      styled into `RangeSlider`'s two-thumb shape at all, so both share
      one hand-rolled implementation rather than one being native and the
      other custom. `usePointerDrag`'s `handlers` (Phase 4's first real
      consumer beyond its own unit tests) are spread on the _track_, not
      just the thumb, so pointerdown anywhere on it both jumps the value
      to that point and starts a drag — grabbing the thumb directly still
      works too, since it's a child of the track and its own pointerdown
      bubbles up to the same handler. Position is recomputed fresh from
      `getBoundingClientRect()` on every move rather than cached at drag
      start, so a mid-drag resize/layout shift can't desync the thumb
      from the pointer. `RangeSlider` reuses `Slider.module.css` directly
      (`.wrapper`/`.track`/`.fill`/`.thumb`) rather than duplicating it —
      same cross-component CSS pattern `MultiSelect` used on `Select
.module.css` — and decides which of its two thumbs a track
      click/drag controls by nearest-distance-to-the-click-point, locked
      in for the whole gesture via a ref (not re-evaluated per move, so a
      fast drag crossing the other thumb's position can't cause the
      active thumb to swap mid-drag). Neither has a `required` prop:
      `aria-required` isn't a supported attribute on `role="slider"`
      (unlike `role="combobox"`/`"textbox"`), the same reasoning
      `DatePicker` already documented for its own `role="button"`
      trigger.
    - **`Rating`'s interaction model — discrete click vs. continuous
      drag — decided at the start of this phase, per the open question
      this line used to carry: discrete click.** Sliding a pointer across
      a star rating while held down isn't a pattern any mainstream rating
      widget actually uses (ratings are single deliberate clicks or
      arrow-key nudges), so `Rating` doesn't use `usePointerDrag` at all
      — a plain `onClick` computing the clicked star position is simpler
      and matches real expected behavior. Also unlike `Slider`, `Rating`
      is a _single_ `role="slider"` spanning all `max` stars (not `max`
      individually-focusable stars, no roving-tabindex group like
      `RadioGroup`/`Menu`) — picking a star rating is fundamentally "one
      adjustable numeric value," the same shape `Slider` already covers,
      just visualized differently; one tab stop, arrow-key adjustable.
      Each star renders twice, stacked — a full outline star underneath,
      a filled star clipped to `fillFraction * 100%` width on top — the
      standard CSS technique for partial-star fills, which naturally
      handles both whole (`allowHalf={false}`, always `0%`/`100%`) and
      half-star (`50%`) cases without branching in the rendering itself,
      only in what `step` resolves to. No hover preview (highlighting
      stars as the pointer moves before a click commits) — a deliberate
      scope cut, same spirit as `DatePicker`'s free-text-parsing punt or
      `NumberField`'s missing stepper UI.
    - jsdom has no `PointerEvent` constructor — tests dispatch a plain
      `MouseEvent` typed `'pointerdown'`/`'pointermove'`/`'pointerup'`
      instead (React's event delegation matches on the event's `.type`
      string, not the constructor class), the same workaround
      `usePointerDrag.test.tsx` already established; dispatched via
      `fireEvent`, not a raw `dispatchEvent`, so the resulting state
      update is `act()`-wrapped.
    - **`Slider`/`RangeSlider` extended** post-launch with a `showValue`
      prop (`'always' | 'drag' | 'off'`, default `'off'` — no visual
      change for existing consumers) to show the current value in a
      tooltip-style bubble. `'drag'` shows it during _either_ an active
      drag _or_ keyboard focus, not drag alone — a mouse/touch-only
      condition would leave keyboard users with no equivalent feedback.
      The bubble (`SliderValueBubble`, exported from `Slider.tsx` so
      `RangeSlider` can reuse it without duplicating the markup) renders
      as a child of the already-`position: absolute` `.thumb` element, so
      its own `position: absolute` resolves relative to the thumb's own
      box for free — no separate positioning math needed, unlike the
      track-relative percentage math the thumb itself needs. Reuses
      `formatValue` (already there for `aria-valuetext`) for the bubble's
      text instead of adding a second formatting prop. `RangeSlider`
      tracks each thumb's drag/focus state _independently_ (a `focusedThumb`
      state plus reading `activeThumbRef` — safe to read during render
      here since it's only ever mutated synchronously inside the same
      `usePointerDrag` handlers that also drive the `isDragging` state
      causing that render), so nudging one thumb never lights up the
      other's bubble.
12. **Segmented Inputs** ✅ shipped — `OTPInput`, `PinInput`:
    - **`OTPInput`** renders `length` real `<input maxLength={1}>`
      segments sharing _one_ controllable string `value` (not `length`
      independent pieces of state), so a consumer's `value`/`onChange`
      sees exactly what a native single input would. That plain-string
      representation only works if segments are filled _contiguously
      from index 0_ — a string can't otherwise distinguish "digit at
      position 2" from "position 1 was skipped." Rather than accept that
      as an edge-case limitation, focusing any segment past the first
      empty one snaps focus back to that first empty segment instead —
      still allows clicking back into an already-filled earlier segment
      to correct it, just never lets a gap form. Paste distributes the
      clipboard text across segments starting at whichever one is
      focused, safe under the same guarantee. Masking (`mask`) reuses
      native `type="password"` per segment rather than hand-rolling CSS
      dot-masking — consistent, accessible, and works with password
      managers for free, the same reasoning `PasswordField` already
      established for not reinventing native masking.
      - **Real bug found and fixed while building this**: the gap-guard
        above initially read `value` from the render closure, which is
        stale at the exact moment it matters most — `handleChange`'s own
        auto-advance `.focus()` call fires the _next_ segment's focus
        handler synchronously, before React has re-rendered with the
        just-typed character, so that handler saw the _pre-keystroke_
        value and concluded the segment being advanced _to_ was still
        beyond the first empty one, redirecting focus right back to where
        it started — auto-advance appeared to silently do nothing. Fixed
        with a `valueRef` updated synchronously alongside the state
        (inside the same `commit()` that calls `setValue`), so the focus
        guard always reads what was _just_ committed, not last render's
        value. A concrete instance of "an event triggered from inside a
        handler, before that handler's own state update has flushed, can
        observe stale state via any closure that captured it" — worth
        watching for in any future component that also calls `.focus()`
        (or otherwise triggers a nested event) synchronously right after
        a `setState` call in the same handler.
      - Also worth noting from writing this component's tests:
        `fireEvent.focus()` dispatches only the synthetic event, not a
        real DOM focus change (`document.activeElement` doesn't move) —
        a real `element.focus()` call is required to assert
        `toHaveFocus()` meaningfully, the same distinction already
        documented for Checkbox/Switch's Playwright verification in
        Phase 8, now confirmed to matter for Vitest/RTL unit tests too.
    - **`PinInput`** is a thin wrapper fixing `OTPInput`'s `mask` to
      `true` and defaulting `length` to 4 (the common PIN length, still
      overridable) — the same "generate a preset, don't reimplement"
      shape `TimePicker`-on-`Select` and `Autocomplete`-on-`Combobox`
      already established.
13. **Overlay Family** ✅ shipped — `Drawer`, `Dialog` enhanced with
    `Header`/`Body`/`Footer` + a `size` prop:
    - **`Dialog` enhancements are purely additive** — `Header`/`Body`/
      `Footer` are optional structural aids (border/spacing/alignment for
      a header, a scrollable middle, a right-aligned footer), not a
      replacement API; the original `title`+`children` path still works
      exactly as before. `title` is now optional (was required) since a
      consumer building a custom heading via `Dialog.Header` doesn't need
      it — `aria-label` is the fallback accessible name when `title` is
      omitted. A close ("×") button is new and **on by default**
      (`showCloseButton`), which is a real, deliberate behavior change:
      it's now the first focusable element in the panel, so it — not a
      consumer's own first content button — receives initial focus on
      open. Covers what a separate `Modal` component would have been, per
      the consolidation decision this roadmap already committed to rather
      than leaving open.
    - **`Drawer`** is `Dialog`'s edge-anchored sibling — same overlay
      mechanics (`Portal`, `useFocusTrap`, `useEscapeKey`, body-scroll
      lock, backdrop-click-to-close) via a `placement` prop
      (`'left'`/`'right'`/`'top'`/`'bottom'`, default `'right'`), covering
      both Bottom Sheet (`placement="bottom"`) and Action Sheet (Mobile
      category — just a bottom-placement preset with action-list content,
      no separate component), per the other consolidation decision this
      roadmap already committed to. Reuses `Dialog`'s `Header`/`Body`/
      `Footer` parts _directly_ (the same components, not a
      re-implementation — they're generic wrappers with nothing
      Dialog-specific in them) and `Dialog.module.css`'s `.backdrop`,
      since an absolutely-positioned panel is unaffected by the
      backdrop's flex-centering rules made for `Dialog`'s centered
      panel — only the backdrop's padding needs overriding (a drawer
      sits flush against the viewport edge), via the doubled-class
      technique (`CLAUDE.md`) so it wins regardless of import order.
      `placement="bottom"` gets a draggable grabber handle
      (`usePointerDrag`) for swipe-to-dismiss.
      - **Real bug found and fixed while building this**: the grabber's
        `onDragEnd` originally read the just-dragged distance via a
        _functional_ `setDragOffset((current) => ...)` updater so it
        could act on the latest value, then called `setIsOpen(false)`
        from _inside_ that updater when past the dismiss threshold. React
        flagged this immediately: "Cannot update a component while
        rendering a different component" — an updater function must stay
        a pure computation of next state from previous state; calling a
        second `setState` from inside one runs it during React's own
        render/reconciliation work, not as a normal event-driven update.
        Fixed with a ref (`dragOffsetRef`) updated synchronously
        alongside the state, read directly in `onDragEnd` instead of
        through either an updater or (per the `OTPInput` lesson from
        Phase 12) a stale render closure — the same shape of fix, a
        different way to trigger the same underlying class of mistake.

14. **Global Feedback Surfaces** ✅ shipped — `Alert`, `Banner`,
    `Toast`/`ToastProvider`/`useToast` (covers Snackbar), `LoadingOverlay`:
    - **`Alert`/`Banner`** share one variant language (`info`/`success`/
      `warning`/`danger`), the same `AlertVariantIcon` SVG dispatcher, and
      the urgency-based `role="alert"` (warning/danger, interrupts) vs.
      `role="status"` (info/success, polite) split already used
      elsewhere in the library — but are deliberately two components, not
      one with a `fullWidth` prop: `Alert` is a rounded, bordered card
      with an optional `title`, meant to sit inline as one block among
      others; `Banner` is edge-to-edge with no radius/card border, no
      `title` (a single short line), meant to sit flush against a page or
      section edge. `Banner` reuses `AlertVariantIcon` and `Alert.module
.css`'s standalone `.dismissButton` rule directly, but gives itself
      its own local icon-coloring rule rather than reusing `Alert.module
.css`'s `.icon` — that rule is a descendant selector
      (`.alert[data-variant='...'] .icon`) that only matches inside an
      element carrying `Alert`'s own `.alert` class, so reusing it as-is
      on `Banner`'s root (which carries `.banner` instead) would have
      silently rendered the icon uncolored, no error. Caught by reasoning
      through the CSS before writing any test, not via live debugging —
      worth noting since the equivalent mistake in `Alert`'s own first
      draft (a `color-mix()`-based tinted background, rejected per
      CLAUDE.md's token-strictness rule and `Badge`'s existing "subtle
      variant" precedent for the same "no tinted-background token exists"
      constraint) was also caught before shipping, not after.
    - **`Toast`/`ToastProvider`/`useToast`** is a `Context`+`Provider`+
      `Hook` split, the same shape `ThemeContext`/`ThemeProvider`/
      `useTheme` established in Phase 3 — except `ToastProvider` genuinely
      renders UI (a `Portal`-mounted viewport plus queued items), unlike
      `ThemeProvider`'s pure `data-theme` side effect, so it lives in
      `src/providers/` (context/provider/hook, matching precedent) while
      its visual pieces (`ToastItem`, `Toast.module.css`) colocate under
      `src/components/Toast/`. `ToastItem` is intentionally **not**
      exported from `src/components/index.ts` — consumers only ever reach
      toasts through `useToast()`'s `toast()`/`dismiss()`/`dismissAll()`,
      never by rendering `ToastItem` directly, matching how `ThemeProvider`
      itself has no `src/components/index.ts` entry either. `position` is
      a single `ToastProvider`-level prop (not per-toast) — matches how
      every mainstream toast library works and keeps `ToastOptions` simple.
      A `limit` prop (default 5) caps visible toasts, dropping the oldest;
      calling `toast({ id })` with an id already queued updates that toast
      in place instead of adding a duplicate. Auto-dismiss is a per-item
      `setTimeout` (`duration` ms, default 5000; `0` disables it) — no
      exit animation, only an entrance one (`@keyframes toast-in`), the
      same simplicity level `Drawer`/`Dialog` already established (neither
      animates its own close). The viewport's stacking direction depends
      on which edge it's anchored to: `flex-direction: column-reverse` for
      `top-*` positions (newest toast is last in DOM order, and
      `column-reverse` renders the last child first, landing the newest
      one closest to the top edge) vs. plain `column` for `bottom-*`
      (newest-last-in-DOM already lands closest to the bottom edge with no
      reversal needed).
    - **`LoadingOverlay`** reuses `Spinner` directly rather than
      reimplementing a rotating indicator, but demotes it to purely
      decorative (`role="presentation" aria-hidden="true"`, both passed
      through `Spinner`'s own prop-spread, which is how `Spinner` normally
      gets to set its _own_ `role="status"`/`aria-label` in the first
      place). `LoadingOverlay`'s own root is the actual `role="status"`
      region instead — a screen reader announces the label once, not
      twice from two nested live regions racing each other. One real gap
      found while writing this component's tests: `role="status"` is
      **not** a name-from-content ARIA role, so an accessible name doesn't
      come for free just by putting text inside it (unlike, say, a
      `<button>`) — `toHaveAccessibleName()` assertions failed until the
      root got an explicit `aria-labelledby` pointing at a `useId()`-
      generated id shared with both the visible `label` text and the
      visually-hidden "Loading" fallback (when no `label` is passed).
      `fullScreen` (default `true`) is `Portal`-rendered, `position:
fixed; inset: 0`; `fullScreen={false}` is `position: absolute;
inset: 0` — the nearest `position: relative` ancestor becomes the
      covered area, the consumer's responsibility to set, the same
      "requires a positioned ancestor" contract already documented for
      other components reusing absolute positioning.
    - No new bugs surfaced during live Storybook/Playwright verification
      for any of the four components (zero console errors across every
      story) — the two near-misses above (`Banner`'s icon CSS, `Alert`'s
      `color-mix()`) were both caught by reasoning through the code before
      any test ran, and the `LoadingOverlay` accessible-name gap was
      caught by the unit tests themselves, not live verification.

### Planned: Phase 15 and beyond

Phases 1-14 above are ✅ shipped (see "Shipped Phase Notes" above for
Phases 4-14's detailed rationale). Phases 15-19 below are the remaining
dependency-ordered roadmap for the rest of the Component Inventory,
written down so a future session can pick up any phase without
re-deriving the ordering. Ordering principle: shared mechanisms before
their consumers, cheap presentational leaves cleared early while that
infra beds in, then outward through infra consumers in increasing
complexity — with anything DatePicker-sized (see Phase 3 above) deferred
to its own session regardless of alphabetical/category order.

15. **Data-Heavy Display** — Accordion (roving focus, same pattern as
    Tabs), Timeline, Calendar (uses `dateGrid.ts` from Phase 4; decide
    here whether to also share `DatePicker`'s grid-rendering JSX/
    keyboard-nav or accept one duplicate copy).
16. **Navigation Shell** — Navbar, Sidebar, Breadcrumb, Pagination,
    Navigation Rail, Bottom Navigation. Depends on Drawer (Phase 13) for
    mobile Sidebar collapse.
17. **Dedicated Deep-Dive Sessions** — each independently schedulable,
    pull any forward once its own prerequisite lands: Data Grid (scope —
    Table-superset vs. dedicated virtualized engine — decided when this
    session starts, not now), Tree View (recursive expand/collapse,
    `aria-level`/`aria-expanded`/`aria-setsize`), Command Palette
    (depends on Phase 10's Combobox filtering + Dialog's modal pattern;
    global Cmd/Ctrl+K hotkey capture), Color Picker (depends on
    `usePointerDrag`; HSL/RGB/HEX conversion), File Upload/Dropzone (one
    component — drag-and-drop is a mode, not a sibling; depends on
    Progress from Phase 5), Carousel (depends on `usePointerDrag`;
    autoplay, reduced-motion, slide-change live-region announcements).
    **Date Range Picker removed from this list**: `DatePicker`'s
    `selectionMode="range"` (added post-launch — see the "DatePicker
    extended" note above) already covers single-calendar start/end range
    picking, which is what this inventory item meant. A genuinely
    different UX (e.g. a dual side-by-side calendar) would be a new,
    explicitly distinct component if ever wanted, not a gap in what's
    already built.
18. **Mobile Gestures** — deferred to its own session: Pull To Refresh,
    Swipe Actions. Share the same touch-simulation testing gap (below),
    verified via `pnpm test:storybook`'s real-browser pass, not
    Vitest/jsdom.
19. **Remaining Utilities & Media** — Scroll Area (thumb drag reuses
    `usePointerDrag`), Split Pane, Resizable (both need `usePointerDrag`),
    Infinite Scroll (needs a new `useIntersectionObserver` hook),
    Masonry, Video, Audio (custom scrubber = pointer-drag again).

**Testing/environment gaps to plan around**: jsdom has no real
pointer-drag/touch physics, `IntersectionObserver`, or `ResizeObserver` —
components depending on `usePointerDrag`, Infinite Scroll, or
layout-observing behavior can only unit-test scripted end-state
assertions in Vitest; actual drag-math/scroll-trigger/gesture-threshold
behavior needs verification via `pnpm test:storybook`'s real Playwright
pass, the same split already documented above for `color-contrast` in
`tests/axe.ts`.

## Component Inventory

Foundations: Box, Flex, Grid, Stack, Inline, Spacer, Container, Center,
Divider, AspectRatio, VisuallyHidden.

Typography: Text, Heading, Display, Label, Paragraph, Caption, Code, Link,
Blockquote, List, ListItem.

Buttons: Button, IconButton, ButtonGroup, ToggleButton, SplitButton,
FloatingActionButton.

Inputs: Input, TextArea, PasswordField, SearchField, NumberField,
EmailField, PhoneField, OTP Input, Pin Input, Select, MultiSelect,
Combobox, Autocomplete, Checkbox, Radio, RadioGroup, Switch, Slider, Range
Slider, Rating, Color Picker, Date Picker (covers Date Range Picker via
`selectionMode="range"` — see Build Order), Time Picker, File Upload,
Dropzone.

Form: Field, Fieldset, Label, HelperText, ErrorMessage, FormGroup,
FormSection.

Navigation: Navbar, Sidebar, Breadcrumb, Tabs, Pagination, Menu, Dropdown,
Context Menu, Command Palette, Navigation Rail, Tree View.

Data Display: Avatar, AvatarGroup, Badge, Chip, Tag, Card, Table, Data
Grid, Accordion, Timeline, Calendar, Statistic, Empty State, Key Value
List.

Feedback: Alert, Banner, Toast, Snackbar (covers via `Toast`/
`ToastProvider`/`useToast` — see Build Order), Progress, Circular
Progress, Skeleton, Spinner, Loading Overlay.

Overlays: Modal (covers via `Dialog`'s `Header`/`Body`/`Footer` parts +
`size` prop — see Build Order), Dialog, Drawer (covers Bottom Sheet and
Sheet via a `placement` prop — see Build Order), Popover, Tooltip, Hover
Card.

Media: Image, Figure, Carousel, Video, Audio.

Utilities: Portal, Focus Trap, Scroll Area, Infinite Scroll, Split Pane,
Resizable, Masonry.

Mobile: Bottom Navigation, Action Sheet (covers via `Drawer`
`placement="bottom"` — see Build Order), Pull To Refresh, Swipe Actions.

## Accessibility

Mandatory for every component: WCAG 2.2 AA compliance, keyboard
navigation, screen reader support, correct ARIA usage, focus management,
reduced-motion support, high-contrast compatibility.

## Testing & Storybook

Every component ships unit tests, interaction tests, an accessibility
test, and keyboard tests, plus stories for: Default, Variants, Disabled,
Loading, Error, Responsive, Accessibility, Controlled, Uncontrolled.

Dark Mode and RTL are **not** separate per-component stories — the global
theme/direction toolbar in `.storybook/preview.tsx` (backed by
`ThemeProvider`) applies to every story automatically, which is more
idiomatic Storybook 8 usage than duplicating a story per component. Use
the toolbar to check a component in every mode instead.

Accessibility tests use `expectNoA11yViolations` (`tests/axe.ts`, backed
by `axe-core` directly — not a testing-library wrapper package):

```ts
it('has no accessibility violations', async () => {
  const { container } = render(<Component />);
  await expectNoA11yViolations(container);
});
```

These `tests/axe.ts` checks run in jsdom (via Vitest), which has no
layout/paint engine — `color-contrast` is disabled there for that reason
(see the file's comment) and is a real-browser-only concern.

That real-browser check happens via `pnpm test:storybook`: it serves
`storybook-static/` and runs `@storybook/test-runner` (Playwright +
chromium) against every story, with `.storybook/test-runner.ts` injecting
axe-core and failing the run on any violation — including contrast, which
the unit tests can't catch. `a11y.test: 'error'` in `.storybook/preview.tsx`
only affects the addon-a11y panel's display during interactive `pnpm dev`;
`test-runner.ts` is what actually enforces this in CI.

A component whose disabled/inactive state is deliberately low-contrast
(WCAG 1.4.3 exempts inactive UI components from contrast minimums) should
mark that state with `aria-disabled` so axe-core recognizes the exemption
instead of flagging it — see `Text.stories.tsx`'s `Colors` story.

## Future Token Integration

The token package is `@mellon/tokens-web`, generated by the
`mellon_designsystem_foundation` repo (sibling directory,
`builds/web/`). It's linked in locally ahead of its npm publish:

```json
"@mellon/tokens-web": "link:../mellon_designsystem_foundation/builds/web"
```

`src/styles/variables.css` imports its CSS (base tokens + light/dark/
high-contrast themes) and maps every `--ds-*` name used by component code
to the real token — see that file's comments for the handful of
non-trivial mappings (the Foundation's numeric spacing scale, layered
`--elevation-N-*` shadow primitives, etc. don't line up 1:1 with the
`--ds-*` names). Component logic must remain independent of the token
implementation — components only ever reference `--ds-*` variable names,
never a Foundation token name directly.

**To sync a real publish later**: bump the version in `package.json`'s
dependency and drop the `link:` protocol, `pnpm install`, then re-check
the mapping in `variables.css` in case token names shifted. No component
`.tsx`/`.module.css` file should need to change.
