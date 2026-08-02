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

**2 phases remain: Phase 18 through Phase 19** (see "Planned: Phase 18 and beyond" below).

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

### Shipped Phase Notes (Phases 4-17)

Short summaries of each completed phase — components shipped and the one
or two decisions worth remembering. Skip to "Planned: Phase 18 and beyond"
below for the actual remaining roadmap.

4. **Shared Infra** — `Popover` (compound trigger+panel primitive, click
   or hover trigger modes), `usePointerDrag` (native Pointer Events, used
   by every later drag-based control), `useRovingFocus` (generalized
   roving-tabindex keyboard nav), `usePositioning` (gained virtual-element
   support for click-point positioning), `src/utilities/dateGrid.ts`
   (pure date math shared by `DatePicker`/`Calendar`), `HelperText`/
   `ErrorMessage` (extracted out of `Field`'s inline rendering).
5. **Presentational Fill-Ins** — 33 components, no state/overlay/drag:
   `Inline`, `Spacer`, `Container`, `Center`, `AspectRatio`,
   `VisuallyHidden`, `Display`, `Label`, `Paragraph`, `Caption`, `Code`,
   `Link`, `Blockquote`, `List`, `ListItem`, `Avatar`, `AvatarGroup`,
   `Badge`, `Chip`, `Tag`, `Statistic`, `EmptyState`, `KeyValueList`,
   `Skeleton`, `Spinner`, `Progress`, `CircularProgress`, `Fieldset`,
   `FormGroup`, `FormSection`, `Image`, `Figure`, `Divider`. Typography
   leaves reuse `Text`'s CSS directly rather than composing `<Text>` as a
   JSX child. `Badge`/`Chip`/`Tag` are three distinct components (static
   pill / removable / linkable label), not one skin.
6. **Popover + First Consumers** — `Tooltip` (reuses `Popover`'s
   underlying hooks, not its JSX — a tooltip needs `aria-describedby`/
   `role="tooltip"`, not `Popover.Trigger`'s popup semantics), `HoverCard`
   (a thin `Popover` preset with `triggerMode="hover"`), `SplitButton`
   (composes `Button` + `Dropdown` directly).
7. **Menus & Roving-Focus Groups** — `IconButton`, `FloatingActionButton`
   (both reuse `Button.module.css` directly), `ButtonGroup` (first real
   `useRovingFocus` consumer), `ToggleButton`, `RadioGroup` (custom
   `role="radio"` divs, automatic activation), `Menu`+`MenuItem` (real
   roving tabindex, manual activation), `ContextMenu` (opens `Menu` at
   click coordinates via `usePositioning`'s virtual-element support). Two
   reusable gotchas found here: `Children.map`/`.toArray` don't unwrap a
   literal `<>...</>` fragment (use `src/utilities/flattenChildren.ts`
   instead), and an unmemoized virtual-element object recreated every
   render can cause a runaway `usePositioning` re-subscribe loop.
8. **Simple Field Controls** — `TextArea`, `PasswordField`, `SearchField`,
   `NumberField`, `EmailField`, `PhoneField`, `Checkbox`, `Switch`. Native
   `<input type="checkbox">`/`role="switch"` visually hidden via
   `VisuallyHidden`, driven by sibling CSS selectors — the standard
   pattern for custom-looking-but-native form controls here. `PhoneField`
   later extended with a `Dropdown`-based country dial-code selector,
   kept as separate controllable state from `value`/`onChange`.
9. **Closed-Set Selects** — `Select` (ARIA "select-only combobox"
   pattern, composes `Popover`), `MultiSelect` (`Select`'s sibling,
   reuses its CSS), `TimePicker` (a thin `Select` wrapper generating a
   time-of-day option list).
10. **Combobox & Autocomplete** — `Combobox` (ARIA "combobox with list
    autocomplete", `aria-activedescendant` + `activeIndex` instead of
    `Select`'s roving-tabindex, since real focus must stay in the text
    input), `Autocomplete` (thin wrapper fixing `allowFreeText=true`).
11. **Drag-Based Inputs** — `Slider`/`RangeSlider` (real `role="slider"`
    widgets, first real `usePointerDrag` consumers, position recomputed
    fresh from `getBoundingClientRect()` on every move), `Rating`
    (discrete click, not drag — sliding isn't real rating UX). Later
    extended with a `showValue` value-bubble prop.
12. **Segmented Inputs** — `OTPInput` (N single-char inputs sharing one
    controllable string value; a focus-redirect guard prevents gaps in
    the string), `PinInput` (thin wrapper, `mask=true`, `length=4`).
13. **Overlay Family** — `Dialog` gained optional `Header`/`Body`/`Footer`
    parts + a `size` prop + an on-by-default close button (covers what a
    separate `Modal` would have been); `Drawer` (`Dialog`'s edge-anchored
    sibling via a `placement` prop, covers Bottom Sheet and Action Sheet,
    `placement="bottom"` gets swipe-to-dismiss via `usePointerDrag`).
14. **Global Feedback Surfaces** — `Alert`/`Banner` (shared variant
    language and icon dispatcher, deliberately two components not one),
    `Toast`/`ToastProvider`/`useToast` (Context+Provider+Hook split,
    covers Snackbar), `LoadingOverlay` (reuses `Spinner`, demoted to
    decorative).
15. **Data-Heavy Display** — `Accordion` (WAI-ARIA APG pattern,
    `useRovingFocus` manual activation), `Timeline` (purely
    presentational `<ol>`/`<li>`), `Calendar` (always-visible day grid,
    reuses `dateGrid.ts` math and `DatePicker`'s CSS but not its JSX). A
    real bug here: an effect that moved DOM focus by checking
    `container.contains(document.activeElement)` broke across a keyed
    grid rebuild (e.g. changing month) — fixed by tracking interaction
    explicitly via a ref instead of inferring it from DOM containment.
16. **Navigation Shell** — `Navbar` (presentational shell, no built-in
    mobile drawer), `Sidebar` (`asDrawer` prop delegates to `Drawer` for
    mobile collapse), `Breadcrumb`/`Pagination` (deliberately no
    roving-tabindex — each link/button is an independent destination),
    `Navigation Rail`/`Bottom Navigation` (share the same per-item shape
    via cross-component CSS reuse, kept as two components per the
    inventory's explicit listing).
17. **Dedicated Deep-Dive Sessions** — all six built in one session:
    `Data Grid` (Table-superset composing `Table`'s own subcomponents,
    not a virtualized engine, deliberately not `role="grid"`), `Tree
View` (data-driven recursive `nodes` prop; a real bug — the nested
    `role="group"` inflated the parent's accessible name once expanded,
    fixed with `aria-labelledby`), `Command Palette` (reuses `Dialog` for
    the shell and `Combobox`'s interaction model, not its JSX, plus a
    Cmd/Ctrl+K hotkey), `Color Picker` (HSV internally for the picker
    square's math, full HEX/RGB/HSL/HSV conversions exported), `File
Upload`/`Dropzone` (one `<label>`+`<input type="file">` is both
    trigger and drop target, fully controlled), `Carousel` (W3C APG
    Carousel pattern, autoplay respects `prefers-reduced-motion`, always
    ships an explicit Play/Pause button per WCAG 2.2.2). Two contrast
    issues were found and fixed in this phase's _story_ demo content
    (not the components) — see "Known Issues" below.

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

### Planned: Phase 18 and beyond

Phases 1-17 above are ✅ shipped (see "Shipped Phase Notes" above for
Phases 4-17's detailed rationale). Phases 18-19 below are the remaining
dependency-ordered roadmap for the rest of the Component Inventory,
written down so a future session can pick up any phase without
re-deriving the ordering. Ordering principle: shared mechanisms before
their consumers, cheap presentational leaves cleared early while that
infra beds in, then outward through infra consumers in increasing
complexity — with anything DatePicker-sized (see Phase 3 above) deferred
to its own session regardless of alphabetical/category order.

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
