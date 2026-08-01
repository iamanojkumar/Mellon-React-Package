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
Slider, Rating, Color Picker, Date Picker, Time Picker, Date Range Picker,
File Upload, Dropzone.

Form: Field, Fieldset, Label, HelperText, ErrorMessage, FormGroup,
FormSection.

Navigation: Navbar, Sidebar, Breadcrumb, Tabs, Pagination, Menu, Dropdown,
Context Menu, Command Palette, Navigation Rail, Tree View.

Data Display: Avatar, AvatarGroup, Badge, Chip, Tag, Card, Table, Data
Grid, Accordion, Timeline, Calendar, Statistic, Empty State, Key Value
List.

Feedback: Alert, Banner, Toast, Snackbar, Progress, Circular Progress,
Skeleton, Spinner, Loading Overlay.

Overlays: Modal, Dialog, Drawer, Bottom Sheet, Popover, Tooltip, Hover
Card, Sheet.

Media: Image, Figure, Carousel, Video, Audio.

Utilities: Portal, Focus Trap, Scroll Area, Infinite Scroll, Split Pane,
Resizable, Masonry.

Mobile: Bottom Navigation, Action Sheet, Pull To Refresh, Swipe Actions.

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
