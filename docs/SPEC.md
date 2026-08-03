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
package — [`@mellon-design/tokens-web`](https://www.npmjs.com/package/@mellon-design/tokens-web)
— now exists and is published on npm (see "Future Token Integration"), so
components already render with real values while the integration path
stays the same either way: updating the styling layer only, never
component logic.

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
`@mellon-design/tokens-web` tokens (imported from the published npm
package — see "Future Token Integration"). Component code never changes
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
4. **Shared Infra** — `Popover`, `usePointerDrag`, `useRovingFocus`, `usePositioning` virtual-reference support, `dateGrid.ts`, `HelperText`/`ErrorMessage` ✅ shipped
5. **Presentational Fill-Ins** — 33 components across Foundations/Typography/Data Display/Feedback/Form/Media ✅ shipped
6. **Popover + First Consumers** — `Tooltip`, `HoverCard`, `SplitButton` ✅ shipped
7. **Menus & Roving-Focus Groups** — `IconButton`, `FloatingActionButton`, `ButtonGroup`, `ToggleButton`, `RadioGroup`, `Menu`, `ContextMenu` ✅ shipped
8. **Simple Field Controls** — `TextArea`, `PasswordField`, `SearchField`, `NumberField`, `EmailField`, `PhoneField`, `Checkbox`, `Switch` ✅ shipped
9. **Closed-Set Selects** — `Select`, `MultiSelect`, `TimePicker` ✅ shipped
10. **Combobox & Autocomplete** — `Combobox`, `Autocomplete` ✅ shipped
11. **Drag-Based Inputs** — `Slider`, `RangeSlider`, `Rating` ✅ shipped
12. **Segmented Inputs** — `OTPInput`, `PinInput` ✅ shipped
13. **Overlay Family** — `Drawer`, `Dialog` enhanced with `Header`/`Body`/`Footer` + a `size` prop ✅ shipped
14. **Global Feedback Surfaces** — `Toast`/`ToastProvider`/`useToast` (covers Snackbar), `Alert`, `Banner`, `LoadingOverlay` ✅ shipped
15. **Data-Heavy Display** — `Accordion`, `Timeline`, `Calendar` ✅ shipped
16. **Navigation Shell** — `Navbar`, `Sidebar`, `Breadcrumb`, `Pagination`, `Navigation Rail`, `Bottom Navigation` ✅ shipped
17. **Dedicated Deep-Dive Sessions** — `Data Grid`, `Tree View`, `Command Palette`, `Color Picker`, `File Upload`/`Dropzone`, `Carousel` ✅ shipped
18. **Mobile Gestures** — Pull To Refresh, Swipe Actions 🔲 backlog
19. **Remaining Utilities & Media** — Scroll Area, Split Pane, Resizable, Infinite Scroll, Masonry, Video, Audio 🔲 backlog
20. **AI Core Infra** — `AIContext`/`AIProvider`/`useAI`, `useAIAction`, `AITriggerButton`, `AISuggestionPopover` ✅ shipped
21. **Flagship AI Components** — `TextArea` (`aiRewrite`), `SearchField` (`aiSearch`), `Alert` (`aiExplain`), `DataGrid` (`aiTableQuery`/`aiRowExplain`), `CommandPalette` (`aiSearch`), `EmptyState` (story only) ✅ shipped
22. **AI Enhancement Backlog** — remaining 95 components' AI opportunities (26 with a real opportunity, 69 with none — see `docs/COMPONENT_LIST.md`); all 26 shipped ✅ shipped
23. **Chat Conversation Core** — `MessageBubble`, `MessageMeta`, `CitationMarker`, `TypingIndicator`, `StreamingCursor` ✅ shipped
24. **Message Actions & Reasoning UI** — `MessageActionBar`, `FeedbackControl`, `ThinkingBlock`, `ToolTraceViewer`, `StatusLine` ✅ shipped
25. **AI Response Surfaces** — `CitationCard`, `CodeBlockToolbar`, `ChartSurface` ✅ shipped
26. **Composer Extensions** — `MentionPicker`, `SlashCommandPicker`, `PromptTemplatePicker`, `TokenCounter` ✅ shipped
27. **Conversation Shell & Memory** — `ConversationHeader`, `MemoryListItem`, `MemoryEditor` ✅ shipped

**2 phases remain, both backlog: 18 and 19** (see "Backlog: Phase 18 and 19" below). Phases 20-22 (AI integration) are an unrelated feature track that jumped ahead of 18-19 in build order — numbered to continue the existing sequence rather than interleave, with no dependency on Mobile Gestures/Remaining Utilities either direction. Phases 23-27 (AI Chat Components) are a third, later track building on Phase 20's infra (`useAIAction`'s status vocabulary, `AISuggestionPopover`'s composition patterns) but not on 18/19/21/22 — the entire track is now shipped, see "Shipped Phase Notes" below for the per-phase write-ups.

Phase 2 added the shared value/field plumbing later Form components build
on: **`useControllableState`** (`src/hooks`) is the standard controlled/
uncontrolled value pattern used throughout the library, and
**`FieldContext`/`useFieldContext`** (`src/contexts`, `src/hooks`) is how
`Field` wires `id`/`aria-describedby`/`aria-invalid`/`required`/`disabled`
onto whatever control it wraps (context, not `cloneElement` — every later
Form control needs to plug into it, and `cloneElement` only supports one
child).

Phase 3 built the overlay/composite-widget infra every later interactive
component reuses: **`useFocusTrap`/`<FocusTrap>`** (Tab-cycling + focus
restore), **`usePositioning`** (wraps `@floating-ui/dom`),
**`useClickOutside`/`useEscapeKey`**, **`mergeRefs`**, and the
**compound-component convention** (`Object.assign(Root, { Part1, Part2,
displayName })`, parts also individually named-exported — every later
compound component follows this). `Portal` renders synchronously (fixed
from an earlier tick-delayed version that raced consumers whose effects
depended on the portaled ref in the same commit). `DatePicker` shipped in
its own session: a button trigger + popover day grid (`role="grid"`/
`"gridcell"` `<div>`s with roving `tabIndex`, always a fixed 6-week grid).
Extended post-launch with month/year drill-down navigation and
`selectionMode="range"` (a parallel `rangeValue`/`onRangeChange` prop set).

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

### Shipped Phase Notes (Phases 4-17, 20-22) — condensed history

One line per phase: what shipped and the single decision worth
remembering. Full prior write-ups (multi-paragraph rationale per phase)
have been superseded by this condensed form — check `git log` on this
file for the detailed version if deeper archaeology is ever needed.

4. **Shared Infra** — `Popover`, `usePointerDrag`, `useRovingFocus`,
   `usePositioning` (virtual-element support), `dateGrid.ts`,
   `HelperText`/`ErrorMessage`. Everything later interactive/drag/date
   work builds on this.
5. **Presentational Fill-Ins** — 33 no-state/no-overlay leaves (`Inline`
   through `Divider`). Typography leaves reuse `Text`'s CSS directly.
   `Badge`/`Chip`/`Tag` stayed three distinct components, not one skin.
6. **Popover + First Consumers** — `Tooltip` (reuses `Popover`'s hooks,
   not its JSX — needs `role="tooltip"` not popup semantics), `HoverCard`
   (`Popover` preset, `triggerMode="hover"`), `SplitButton`.
7. **Menus & Roving-Focus Groups** — `IconButton`, `FloatingActionButton`,
   `ButtonGroup` (first `useRovingFocus` consumer), `ToggleButton`,
   `RadioGroup`, `Menu`/`MenuItem`, `ContextMenu`. Gotchas found:
   `Children.map`/`.toArray` don't unwrap a literal fragment (use
   `flattenChildren.ts`), and an unmemoized virtual-element object can
   cause a runaway `usePositioning` re-subscribe loop.
8. **Simple Field Controls** — `TextArea`, `PasswordField`, `SearchField`,
   `NumberField`, `EmailField`, `PhoneField`, `Checkbox`, `Switch`.
   Custom-looking native controls hidden via `VisuallyHidden` + sibling
   CSS selectors is the standard pattern here.
9. **Closed-Set Selects** — `Select`, `MultiSelect`, `TimePicker` (thin
   `Select` wrapper).
10. **Combobox & Autocomplete** — `Combobox` (`aria-activedescendant`,
    not roving-tabindex — focus must stay in the input), `Autocomplete`
    (thin wrapper, `allowFreeText=true`).
11. **Drag-Based Inputs** — `Slider`/`RangeSlider` (first real
    `usePointerDrag` consumers), `Rating` (discrete click, not drag).
12. **Segmented Inputs** — `OTPInput` (focus-redirect guard prevents gaps
    in the shared string value), `PinInput` (thin wrapper).
13. **Overlay Family** — `Dialog` gained `Header`/`Body`/`Footer` +
    `size` + a default close button (covers `Modal`); `Drawer`
    (`Dialog`'s edge-anchored sibling, covers Bottom Sheet/Action Sheet).
14. **Global Feedback Surfaces** — `Alert`/`Banner` (two components, one
    shared variant language), `Toast`/`ToastProvider`/`useToast` (covers
    Snackbar), `LoadingOverlay`.
15. **Data-Heavy Display** — `Accordion`, `Timeline`, `Calendar`. Real bug
    fixed: focus-move logic that inferred state from DOM containment
    broke across a keyed grid rebuild — track interaction via a ref
    instead.
16. **Navigation Shell** — `Navbar`, `Sidebar` (`asDrawer` → `Drawer` on
    mobile), `Breadcrumb`/`Pagination` (no roving-tabindex — independent
    destinations), `Navigation Rail`/`Bottom Navigation`.
17. **Dedicated Deep-Dive Sessions** — `Data Grid`, `Tree View` (real bug:
    nested `role="group"` inflated the parent's accessible name — fixed
    with `aria-labelledby`), `Command Palette`, `Color Picker`, `File
Upload`/`Dropzone`, `Carousel`. Two story-content contrast issues
    found and fixed here (not the components) — see "Known Issues".
18. **AI Core Infra** — `AIContext`/`AIProvider`/`useAI` (Context/
    Provider/Hook split, `useAI` doesn't throw outside its provider —
    AI is opt-in), `useAIAction` (adds `'streaming'` to `FileUpload`'s
    status vocabulary, no global job queue by design), `AITriggerButton`,
    `AISuggestionPopover`. **Confirmed with the user up front**: this
    library never bundles a vendor SDK/API key/`fetch` — it defines only
    an `AIClient` interface (`complete`/optional `stream`), consumer owns
    transport. Real bug found: `Popover.Content` silently doesn't forward
    `aria-label` (TS's `aria-*` excess-property exemption let it typecheck
    while axe failed at runtime) — fixed by putting `role="dialog"` + the
    accessible name on `AISuggestionPopover`'s own inner element.
19. **Flagship AI Components** — `TextArea` (`aiRewrite`), `SearchField`
    (`aiSearch`), `Alert` (`aiExplain`, read-only), `DataGrid`
    (`aiTableQuery`/`aiRowExplain`), `CommandPalette` (`aiSearch.onQuery`
    — the one flagship that skips `AISuggestionPopover`/`AITriggerButton`
    entirely, since turning AI text into executable actions must stay
    app-specific), `EmptyState` (story only, no code change — its
    existing `action` slot already composes arbitrary UI). Real bug found
    across three of these: `useControllableState`'s `setValue` is a
    no-op when controlled (its `onChange` was never wired to the
    consumer's outer `onChange`) — `TextArea`/`SearchField` each grew a
    small `applyAIText`/`applySearchText` helper that calls `setValue`
    **and** fires a minimal synthetic `onChange` event, worth checking
    for in any future component applying a value without a real
    keystroke.
20. **AI Enhancement Backlog** — all 26 components with a genuine AI
    opportunity (see `docs/COMPONENT_LIST.md`'s per-component list) built
    in one session across two shapes: 18 "trigger → `AISuggestionPopover`"
    components (`Code`, `Paragraph`, `Blockquote`, `Input`, `ColorPicker`,
    `FileUpload`, `ErrorMessage`, `Card`, `Table`, `Accordion`, `Timeline`,
    `Calendar`, `Statistic`, `KeyValueList`, `Banner`, `Image`, plus
    `DatePicker`'s `aiParse`, which hand-rolls its own accept/reject
    instead of reusing `AISuggestionPopover` — see below) and 8
    "`CommandPalette`-resolver" components (`Select`, `MultiSelect`,
    `Combobox`, `Autocomplete`, `Menu`, `Dropdown`, `ContextMenu`,
    `TreeView`). `Autocomplete` and `TimePicker` needed zero new code —
    both are thin wrappers (`Combobox`/`Select`) that already spread
    arbitrary props through, so `aiSearch`/`aiSuggest` was inherited for
    free, the same "thin wrapper" precedent `TimePicker`-over-`Select`
    established in Phase 9. `ContextMenu` forwards `aiSuggest` straight to
    its internal `Menu`, wrapping resolved items' `onSelect` to also close
    the menu. `DatePicker`'s `aiParse` is the one exception to both
    shapes: since its panel is already `Popover`-like chrome, nesting a
    second `AISuggestionPopover` inside it would violate CLAUDE.md's "no
    nested overlay boxes" rule, so its query field + accept/reject UI is
    hand-rolled directly into the panel instead, `useAIAction()` for
    status only. `Table`'s `aiTableQuery` mirrors `DataGrid`'s toolbar
    shape but builds its prompt from the rendered table's extracted text
    (`extractTableText`, walking `<tr>`/`<th>`/`<td>`), since `Table` has
    no structured `data` prop unlike `DataGrid`. Two real bugs found: (1)
    an AI trigger button placed inside `Combobox`'s panel stole focus from
    the input, firing its blur-triggered revert before the click
    registered — fixed the same way `Combobox`'s own options already did,
    `onMouseDown={(e) => e.preventDefault()}` on the row; (2) `Combobox`'s
    `value`→`inputValue` sync effect looked up the selected label only in
    the static `options` prop, so accepting an AI-resolved option (not in
    that list) reverted the input to empty — fixed by searching
    `[...options, ...aiOptions]` instead. A documentation bug was also
    caught and fixed mid-phase: an earlier pass miscounted the AI-
    opportunity split as "42/53" (3+9+1+4+7+1+1 mis-added as 42 instead of 26) — corrected to the real 26/69 split in `docs/COMPONENT_LIST.md`
    before continuing; the per-component list itself was always right,
    only the summary totals were wrong.
21. **Chat Conversation Core** — `MessageBubble` (user/AI/system/tool/
    error/status variants, reuses `Card`'s box CSS via a doubled-class
    override rather than duplicating it), `MessageMeta` (composes `Label`
    - `Caption` — `Caption`'s own doc comment already named "timestamps"
      as a use case), `CitationMarker` (composes `Badge`'s pill styling;
      renders `<a>`/`<button>`/`<span>` depending on whether `href`/
      `onClick` is given), `TypingIndicator` and `StreamingCursor` (both
      presentational-only, no `useAI`/`useAIAction` calls of their own —
      same precedent `AISuggestionPopover` set — meant to be driven by the
      owning component's own `useAIAction().status`). No new hooks/context;
      first phase of the "AI Chat Components" track (`docs/SPEC.md`'s
      Backlog section below), unrelated to the Phase 20-22 AI-enhancement
      track beyond reusing its `useAIAction` status vocabulary.
22. **Message Actions & Reasoning UI** — `MessageActionBar` (copy/
    regenerate/continue/simplify/explain + a `extraActions` escape hatch,
    each rendered only when its handler is given — `Alert`'s `onDismiss`
    convention; rolls its own `role="toolbar"` + roving-tabindex via
    `useRovingFocus` directly rather than reusing `ButtonGroup`'s JSX,
    since `ButtonGroup`'s CSS visually joins its items with shared
    borders — the wrong look for a loosely-gapped action row, the same
    "reuse the hook, not the JSX" precedent `Tooltip` set against
    `Popover`), `FeedbackControl` (mutually-exclusive thumbs up/down +
    optional report, built directly on `IconButton` + manual
    `aria-pressed`/`useControllableState` rather than two independent
    `ToggleButton`s, which can't express shared exclusivity state),
    `ThinkingBlock` (fixed single-item `Accordion` preset — the
    established "thin wrapper" shape — with no `ref` prop, since
    `Accordion`'s own root has none either), `ToolTraceViewer` (reuses
    `AlertVariantIcon`'s success/danger glyphs for done/error steps and
    `Spinner`'s CSS class, not the `Spinner` component, for the active
    step — a second nested `role="status"` would double-announce the
    same moment, so every icon stays `aria-hidden` with `aria-current=
"step"` on the active `<li>` instead), `StatusLine` (single labeled
    `role="status"` line, same icon-vs-component reasoning as
    `ToolTraceViewer`'s active step). One real bug found: `ThinkingBlock`
    initially mapped both `open={undefined}` (uncontrolled) and
    `open={false}` (controlled-closed) to `value={undefined}` on the
    underlying `Accordion`, so a controlled-closed `ThinkingBlock` still
    opened on click — `Accordion`'s `useControllableState` treats
    `value={undefined}` as "uncontrolled" with no way to distinguish the
    two — fixed with a defined-but-not-the-item's-value sentinel
    (`''`) for the controlled-and-closed state.
23. **AI Response Surfaces** — `CitationCard` (footnote-style source card;
    the whole card is a real `<a>` when `href` is given, a plain `<div>`
    otherwise — reuses `Card`'s box CSS the same doubled-class way
    `MessageBubble` does), `CodeBlockToolbar` (copy/download/run/expand
    header bar for a `Code` block — a sibling the consumer places
    alongside `Code`, not a prop on it, since `Code` also covers the
    plain inline-snippet case with no toolbar; same roving-focus toolbar
    shape as `MessageActionBar`, but its expand/collapse action reuses
    `ToggleButton` directly since there's no second button it needs to
    stay exclusive with, unlike `FeedbackControl`'s thumbs pair),
    `ChartSurface` (minimal dependency-free bar/line chart, hand-rolled
    inline SVG — no charting library, the same "no icon library"
    precedent applied to data-viz; the SVG is `aria-hidden`, with a
    `VisuallyHidden` `Table` of every label/value pair as the chart's
    real accessible content, the standard accessible-chart pattern).
    PDF viewer and Map embed excluded — grouped with Phase 19's
    Video/Audio backlog instead. One test-only issue found (not a
    component bug): `ChartSurface`'s visible axis labels and its hidden
    data table both render the same text (e.g. "Jan"), so `getByText`
    needs disambiguating — jsdom doesn't apply the CSS clip technique
    `VisuallyHidden` relies on, so both copies are equally "present" to a
    query that doesn't scope by container.
24. **Composer Extensions** — a new shared hook,
    **`useFloatingListPicker`** (`src/hooks/`), factors out the
    positioning/dismissal/keyboard-delegation logic `MentionPicker` and
    `SlashCommandPicker` both need — the same "generalize once two
    components need the identical mechanics" precedent `useRovingFocus`
    itself set (Phase 4). Both anchor to an arbitrary viewport point (a
    host `TextArea`'s caret, computed by the consumer — this hook does
    not measure caret position itself) via the same virtual-element
    `usePositioning` trick `ContextMenu` established for click-point
    placement, not `Popover` (no trigger element exists to anchor to).
    Real focus must stay in the host `TextArea`, so neither component
    listens for keyboard input itself; the hook exposes `handleKeyDown`
    via `useImperativeHandle`, and the consumer's own `TextArea`
    `onKeyDown` must call it and act on the returned boolean.
    `MentionPicker` (people, avatar + name + description) and
    `SlashCommandPicker` (commands, icon + label + description) share
    this hook's mechanics but stay two separate components with distinct
    data models — the same "share the mechanics, not the component"
    choice `Alert`/`Banner` made. `PromptTemplatePicker` is structurally
    different — a normal trigger-button-driven panel, not caret-anchored
    — so it composes `Popover` + `Menu` directly instead; since `Menu`
    already renders its own full box (designed to be usable standalone),
    nesting it inside `Popover.Content`'s own default box would double
    the border, so `Popover.Content`'s box chrome is stripped to nothing
    via a doubled-class override, the inverse of `Combobox`'s fix (there
    the _inner_ content stays layout-only; here the _outer_ wrapper
    does) — both are instances of CLAUDE.md's "no nested overlay boxes"
    rule. `TokenCounter` estimates `~length/4` by default (a rough
    heuristic, not a real tokenizer — this library never bundles one,
    the same "no vendor SDK" boundary `AIClient` draws for completions)
    and is deliberately not a `role="status"` live region, unlike
    `StatusLine` — announcing every keystroke's new count would spam
    assistive tech. One test-tooling issue found (not a component bug):
    `userEvent.type()` with a `{ArrowDown}{Enter}` key sequence
    delegated through a ref-exposed `handleKeyDown` call intermittently
    didn't reflect the resulting state update in time for the next
    assertion; switched those specific interaction tests to
    `fireEvent.keyDown` wrapped in `act()`, which resolved it —
    `userEvent`'s special-key syntax worked fine elsewhere (e.g. the
    `Escape`-closes tests), so this looks specific to that delegated-ref
    - rapid-sequence combination, not a general problem with `type()`.
25. **Conversation Shell & Memory** — `ConversationHeader` (title/tags/
    model-used/participants/actions, a `<header>` layout shell — no `ref`
    forwarding, no compound context, the same category `Navbar` is;
    `participants`/`actions` are plain slots rather than baking in
    `AvatarGroup`/`Button` opinions this component has no business
    making, the same "accept a slot" precedent `MessageBubble`'s `avatar`
    prop set), `MemoryListItem` (a single `<li>`, meant to live inside a
    consumer-supplied `<ul>` — presentational only, `onForget` is the
    consumer's own removal logic), `MemoryEditor` (a `MemoryListItem` per
    entry plus an add-new-memory form; a real `<form onSubmit>`, not a
    manual keydown handler, so Enter-to-submit and the button both work
    via the platform's own submit behavior — the draft text is local,
    ephemeral state this component owns, only committed `onAdd`/
    `onForget` calls reach the consumer). This is the last phase of the
    "AI Chat Components" track (Phases 23-27) — all five are now shipped.
    No new bugs found.

### Known Issues

**5 pre-existing test suites fail `pnpm test:storybook`'s real-browser
`color-contrast` check** (confirmed unrelated to any work in Phases 15-17
via `git status` — none of these files were touched): `Badge`, `Chip`,
`CircularProgress`, `Progress`, `LoadingOverlay`. Not caught by the unit
test suite because `tests/axe.ts` disables `color-contrast` in jsdom (no
layout engine) — `pnpm test:storybook` is the only check that catches it.
Re-confirmed present and unfixed across three phases' worth of
verification runs (15, 16, 17) — worth a dedicated fix pass rather than
continuing to re-note it.

### Backlog: Phase 18 and 19 (not started)

Phases 1-17 and 20-22 above are ✅ shipped. Phases 18-19 are 🔲 **backlog**
— the remaining dependency-ordered roadmap for the rest of the Component
Inventory, written down so a future session can pick either up without
re-deriving the ordering. Neither depends on the other or on Phase 22.

18. **Mobile Gestures** (backlog) — Pull To Refresh, Swipe Actions.
    Deferred to its own session; needs real-browser touch-simulation
    verification via `pnpm test:storybook`, not Vitest/jsdom.
19. **Remaining Utilities & Media** (backlog) — Scroll Area, Split Pane,
    Resizable (all reuse `usePointerDrag`), Infinite Scroll (needs a new
    `useIntersectionObserver` hook), Masonry, Video, Audio.

### AI Chat Components track: complete (Phases 23-27)

The "AI Chat Components" track built the chat-conversation-specific UI
surfaces identified in `docs/COMPONENT_LIST.md`'s "Cross-check against the
AI-chat-interface taxonomy" section — the genuinely net-new pieces needed
to assemble a working AI chat interface (ChatGPT/Claude/Gemini/Copilot-
style), as opposed to the much larger set of adjacent subsystems that
taxonomy also surfaced (voice pipelines, canvas/whiteboard, 3D viewers,
enterprise back-office screens, ...) — those were deliberately left out;
see "Out of scope" below for why each was excluded. Numbered to continue
the sequence after Phase 22, same precedent as Phases 20-22 jumping ahead
of 18-19. All five phases (23: Chat Conversation Core; 24: Message
Actions & Reasoning UI; 25: AI Response Surfaces; 26: Composer
Extensions; 27: Conversation Shell & Memory) are now shipped — see their
write-ups in "Shipped Phase Notes" above. Model/generation controls
(temperature, tool-permission toggles) needed no new component — same
"Storybook composition only, no code" precedent as `EmptyState` in
Phase 21, since the taxonomy already notes these are fully covered by
`Select`/`Slider`/`Switch`/`FormGroup`.

**Out of scope** (documented in the taxonomy cross-check, deliberately
not phased): Voice Interface (mic/live transcription/waveform — needs
`MediaRecorder`/`getUserMedia`, never integrated in this repo), Image
Generation UI's inpainting/outpainting canvas, Canvas/Workspace
(whiteboard, sticky notes, diagram editor — a full canvas engine),
File workspace extras beyond what `Table`/`DataGrid`/`TreeView`/`Tabs`
already cover (diff viewer, embedded code editor, spreadsheet/notebook
preview), Multi-modal camera/OCR/3D viewer (device/3D rendering
integrations), Enterprise features (audit log, compliance, approval
workflows — app-specific business logic), and Authentication, Settings
panels, Export menus, Search results panel, Notifications/connectivity,
Context-usage tray, Error taxonomy, AI capabilities toggle panel,
Developer/power-user inspectors, Specialized widget cards, Advanced
interaction patterns (branch/fork, multi-agent view, workflow builder),
and Collaboration (live cursors/presence) — the taxonomy document already
marks each as covered by existing primitives for ad-hoc app composition,
or as app-specific orchestration rather than a reusable design-system
component, the same "don't force a feature onto every component"
principle Phase 22's scoping already applied.

**Testing/environment gaps to plan around**: jsdom has no real
pointer-drag/touch physics, `IntersectionObserver`, or `ResizeObserver` —
components depending on `usePointerDrag`, Infinite Scroll, or
layout-observing behavior can only unit-test scripted end-state
assertions in Vitest; actual drag-math/scroll-trigger/gesture-threshold
behavior needs verification via `pnpm test:storybook`'s real Playwright
pass, the same split already documented above for `color-contrast` in
`tests/axe.ts`.

### Future: real AI backend wiring

Deliberately **out of scope** for Phases 20-22 — every AI-enhanced component
and Storybook story was built and tested against a mock/deterministic
`AIClient`, per an explicit up-front scope decision with the user, so a
production `AIClient` implementation and any real API key never touch
this repo's own code or tests. A live demo (e.g. a real key wired into a
Storybook-only `AIClient` via `AIProvider`) is a natural follow-up, but
needs this repo's first-ever `.env`/env-var convention (currently zero
`import.meta.env`/`process.env` usage anywhere in `src/`) — introduce that
convention deliberately in its own session rather than folding it
silently into a future phase.

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

AI: AITriggerButton, AISuggestionPopover (shared primitives from Phase 20;
`AIProvider`/`useAI`/`useAIAction` are infra in `src/providers`/`src/hooks`,
not components, so aren't listed here — see Build Order Phase 20).

AI Chat: MessageBubble, MessageMeta, CitationMarker, TypingIndicator,
StreamingCursor (Phase 23, shipped); MessageActionBar, FeedbackControl,
ThinkingBlock, ToolTraceViewer, StatusLine (Phase 24, shipped);
CitationCard, CodeBlockToolbar, ChartSurface (Phase 25, shipped);
MentionPicker, SlashCommandPicker, PromptTemplatePicker, TokenCounter
(Phase 26, shipped); ConversationHeader, MemoryListItem, MemoryEditor
(Phase 27, shipped) — see Build Order Phases 23-27 and
`docs/COMPONENT_LIST.md`'s "AI Chat" section.

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

## Token Integration

The token package is
[`@mellon-design/tokens-web`](https://www.npmjs.com/package/@mellon-design/tokens-web),
generated by the `mellon_designsystem_foundation` repo (sibling
directory, `builds/web/`) and now published on npm — this repo depends
on the real registry package, not a local `link:`:

```json
"@mellon-design/tokens-web": "^1.0.0"
```

(Prior to publish, this was a local `link:../mellon_designsystem_foundation/builds/web`
dependency during development — kept here as history in case a future
Foundation redesign needs the same local-link workflow again.)

`src/styles/variables.css` imports its CSS (base tokens + light/dark/
high-contrast themes) and maps every `--ds-*` name used by component code
to the real token — see that file's comments for the handful of
non-trivial mappings (the Foundation's numeric spacing scale, layered
`--elevation-N-*` shadow primitives, etc. don't line up 1:1 with the
`--ds-*` names). Component logic must remain independent of the token
implementation — components only ever reference `--ds-*` variable names,
never a Foundation token name directly.

**To pick up a new Foundation release**: bump the version in
`package.json`'s dependency, `pnpm install`, then re-check the mapping in
`variables.css` in case token names shifted. No component
`.tsx`/`.module.css` file should need to change.
