# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the Mellon React design-system component library. `docs/SPEC.md` is the living source of truth for build order, shipped components, and per-component design decisions — read it before starting new work. `docs/COMPONENT_LIST.md` is the companion inventory: the per-component AI-opportunity audit and the AI-chat-interface taxonomy cross-check that scoped which components exist and which were deliberately excluded. `docs/COMPONENTS.md` is the consumer-facing API reference — one row per exported component (purpose + non-obvious props, grouped by the same categories). The three don't overlap: SPEC = why and in what order, COMPONENT_LIST = what exists and what doesn't, COMPONENTS = how to call it. A new public component needs a row in both `COMPONENT_LIST.md` and `COMPONENTS.md`.

**Where the roadmap stands**: SPEC phases 1–17 and 19–31 are shipped (~150 exported components) — Phase 19 shipped `Video`/`Audio` only, and moved its remaining items into Phase 18's backlog slot. Phases 30 (`SegmentTrack`) and 31 (`Canvas`'s `renderBackdrop`/controlled `viewport`, plus `Panel`) are single-addition, real-consumer-request work, not part of the dependency-ordered roadmap — see `docs/SPEC.md`'s Phase 30/31 notes and `docs/COMPONENT_LIST.md`'s Media/Canvas sections. Only **Phase 18 remains as backlog** — Mobile Gestures (Pull To Refresh, Swipe Actions) plus the rest of the old Phase 19 (Scroll Area, Split Pane, Resizable, Infinite Scroll, Masonry). Everything else marked "next" in this file is either blocked on the Foundation palette (see the Chart track) or a deliberate non-goal.

## Commands

```bash
pnpm dev                    # Storybook dev server on :6006
pnpm test                   # Vitest + React Testing Library (run once)
pnpm test:watch             # Vitest watch mode
npx vitest run path/to/File.test.tsx   # run a single test file
pnpm typecheck              # tsc --noEmit
pnpm lint                   # ESLint
pnpm lint:fix
pnpm format                 # Prettier write
pnpm format:check           # Prettier check — not in CI; lint-staged covers staged files
pnpm build                  # tsc --noEmit && vite build -> dist/
pnpm test:storybook         # builds Storybook, serves it, runs @storybook/test-runner (Playwright + axe-core) against every story — the only real-browser check (contrast, live pointer/drag behavior); jsdom-based `pnpm test` can't catch these
pnpm generate:component <Category> <Name>   # scaffolds the standard 5-file set + adds the export to src/components/index.ts
pnpm test:coverage          # vitest run --coverage (v8)
pnpm size                   # size-limit against dist/index.js — 10 KB budget, so `pnpm build` first
pnpm changeset              # every user-facing change needs one
pnpm release                # pnpm build && changeset publish — publishes to npm; don't run casually
```

Commits are checked by husky: `commit-msg` runs commitlint (Conventional Commits — a non-conforming message is rejected outright), `pre-commit` runs lint-staged (ESLint + Prettier on staged files).

`.github/workflows/ci.yml` runs, in order: `lint`, `typecheck`, `test`, `build`, `build:storybook`, `playwright install chromium`, `test:storybook`, `size`. Two of those steps fail on `main` today and will keep failing until deliberately addressed — treat them as known-red, not as damage you caused:

- **`pnpm size` fails.** Budget is 10 KB; the actual bundle is ~46 KB minified+brotlied (a 145-export barrel can't fit 10 KB). Raising the limit is a real decision, not a chore — don't bump it silently to make a task green.
- **`pnpm test:storybook` fails** on the pre-existing `color-contrast` stories listed under Testing below.

`README.md` is stale in two ways that contradict this file, which wins: it shows the `var(--ds-space-md, 1rem)` fallback pattern (banned — no component under `src/` uses a fallback anymore) and describes `src/icons/`/`src/animations/` as populated.

Always run `pnpm typecheck && pnpm lint && pnpm test` after changing/adding a component. For interactive or visually non-trivial components, also verify live via Storybook (`pnpm dev` or a scratch Playwright script driven through `node`, run from the project root so `playwright` resolves from `node_modules`) — jsdom has no real pointer-drag physics, `IntersectionObserver`, `ResizeObserver`, or layout/paint engine, so several classes of bugs are invisible to `pnpm test` alone (see `docs/SPEC.md`'s "Testing/environment gaps" note).

## Architecture

**Per-component 5-file set** — every component under `src/components/<Name>/` owns its implementation, styles, tests, stories, and barrel export:

```text
components/Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
├── Button.stories.tsx
└── index.ts
```

`pnpm generate:component` scaffolds a polymorphic single-element leaf (matching `Box`'s conventions) and wires the export — right for most components, but non-polymorphic/structural/compound components (`Input`, `Portal`, `Dialog`, `Tabs`, `Table`, ...) need manual rework after scaffolding.

**Top-level `src/` layout**, each with one job:

```text
src/components/   # one folder per component (see above)
src/hooks/        # reusable hooks (useTheme, useControllableState, usePointerDrag, useRovingFocus, usePositioning, useFocusTrap, useClickOutside, useEscapeKey, ...)
src/contexts/     # React Contexts (ThemeContext, FieldContext, ToastContext, ...)
src/providers/    # Provider components pairing with a context+hook (ThemeProvider, ToastProvider, ...)
src/styles/       # global CSS variables (variables.css maps every --ds-* name), reset, base — no component styling here
src/utilities/    # mergeClasses, mergeRefs, flattenChildren, resolveSpace/spacingProps, a11y/DOM helpers
src/types/        # PolymorphicComponentPropWithRef and other shared prop/utility types
src/index.ts      # root barrel: re-exports components, contexts, hooks, providers, types, utilities
```

**Build & distribution shape** (`vite.config.ts` + `package.json` `exports`): one ES-only bundle from the single `src/index.ts` entry, `react`/`react-dom`/`react/jsx-runtime` externalized, types emitted by `vite-plugin-dts`. `cssCodeSplit: false` collapses every `.module.css` in the import graph into one `dist/style.css`, exported as `@mellon-design/react/styles.css`. Consequences worth knowing before touching either file:

- A component is only public if it's re-exported from `src/components/index.ts` — `src/index.ts` re-exports the six folder barrels and nothing else, so a component missing from its barrel is absent from `dist` even though its tests and stories pass.
- **`dist/style.css` (component CSS) and `dist/tokens.css` (the `--ds-*` variable definitions) are two deliberately separate build outputs, not one.** `styles/index.css` (which pulls in `variables.css` + `reset.css`) is still imported only by `.storybook/preview.tsx` — `src/index.ts` never imports it, so `dist/style.css` still only ever _consumes_ `var(--ds-*)`, never _defines_ it. `dist/tokens.css` is what actually defines every `--ds-*` variable, resolved from `@mellon-design/tokens-web` — but it's built separately, by `scripts/build-tokens-css.mjs` (run as the last step of `pnpm build`, after `vite build`), not bundled into `dist/style.css` or reachable via `src/index.ts`. This was a real bug through `0.4.0` (components shipped fully unstyled — nothing anywhere defined `--ds-*` — confirmed against a real consumer app) before `dist/tokens.css` existed; a consumer imports both explicitly: `@mellon-design/react/styles.css` then `@mellon-design/react/tokens.css`. Keeping them separate (rather than folding `tokens.css`'s content into `style.css` or `src/index.ts`) is deliberate, not an oversight: it stays opt-in for a consumer who already wires up their own token layer from `@mellon-design/tokens-web` directly. `reset.css` is **not** part of `dist/tokens.css` — it's base/reset styling, a separate concern from variable definitions, and still doesn't ship anywhere in `dist` today.

**`tsconfig.json` is strict beyond the usual**: `noUncheckedIndexedAccess` (any `arr[i]` / `obj[key]` is `T | undefined` — the most common reason new code fails `pnpm typecheck` while passing tests), plus `noUnusedLocals`/`noUnusedParameters` (prefix intentionally-unused params with `_`; the ESLint rule matches). `pnpm build` runs `tsc --noEmit` first, so a type error blocks the bundle.

`src/icons/`, `src/animations/`, and `stories/` exist but are empty — `docs/SPEC.md` and `README.md` describe them as part of the intended layout, but nothing was ever put there (icons are inline per-component, motion values are `--ds-motion-*` tokens used directly in CSS, stories are colocated). Don't start filling them without deciding that's a real change.

**Context/Provider/Hook split**: a stateful cross-cutting concern is `XContext.ts` (the `createContext` call + types) + `XProvider.tsx` (`src/providers/`) + `useX.ts` (`src/hooks/`, throws if used outside its provider) — see `ThemeContext`/`ThemeProvider`/`useTheme` as the reference shape, extended by `ToastContext`/`ToastProvider`/`useToast`. A provider that also renders real UI (not just a side effect like `ThemeProvider`'s `data-theme` attribute) colocates its visual pieces under `src/components/<Name>/` while the context/provider/hook stay in their own top-level folders; internal-only rendering pieces (e.g. `ToastItem`) are not exported from `src/components/index.ts`.

**Polymorphic components**: `PolymorphicComponentPropWithRef<C, OwnProps>` (`src/types/polymorphic.ts`) backs any component with an `as` prop (see `Box.tsx`). Because `children` or another prop is sometimes required on `OwnProps`, `forwardRef`'s generic inference breaks — the established workaround is casting the render function to a hand-written component type (`as unknown as XComponent`) and setting `displayName` via `(X as any).displayName = 'X'` afterward (see `Box`, `Heading`, `AvatarGroup`, `IconButton`).

**Compound components**: root + parts, e.g. `<Dialog><Dialog.Header>...</Dialog.Header></Dialog>`. Each part is its own function component; the root attaches them via `Object.assign(Root, { Part1, Part2, displayName: 'Root' })` in one call (assigning `displayName` afterward doesn't typecheck against a `forwardRef`-cast component). Parts are also individually named-exported. Some compound components share parts directly across trees rather than reimplementing — `Drawer.Header`/`Body`/`Footer` are literally `Dialog`'s own part components, imported and re-assigned.

**Overlay infra, reused rather than rebuilt per component**: `Portal` (renders synchronously into `document.body`, no ref — it relocates children rather than wrapping them), `usePositioning` (wraps `@floating-ui/dom`, accepts a `RefObject` or a virtual element for click-point positioning), `useFocusTrap`/`<FocusTrap>`, `useClickOutside`/`useEscapeKey`, `useFloatingListPicker` (open/highlight/keyboard state for a list panel anchored at a caret point rather than an element — `MentionPicker`/`SlashCommandPicker`; the host input forwards every keystroke to its `handleKeyDown`, which returns whether it consumed the key), and `Popover` (`Popover.Trigger`/`Popover.Content`, click or hover trigger modes) as the shared trigger+panel+positioning+dismiss primitive most later overlays (`Select`, `Combobox`, `Dropdown`) compose — except where `Popover.Trigger`'s hardcoded popup ARIA semantics (`aria-haspopup="dialog"`, etc.) would be wrong for the pattern (e.g. `Tooltip`, which needs `aria-describedby`/`role="tooltip"` instead and so reuses `Popover`'s underlying hooks directly rather than its JSX).

**AI layer** (`AIContext`/`AIProvider`/`useAI` + `useAIAction`): the library never bundles a vendor SDK, API key, or `fetch` call — the consuming app implements the `AIClient` contract (`complete`, optional `stream`) and supplies it through `AIProvider`, the same "component stays dumb, consumer owns transport" split as `FileUpload`/`DataGrid`. `useAIAction` owns one request's lifecycle (`idle | loading | streaming | done | error`, one in-flight request per hook instance — a second `trigger()` aborts the first, no queue). **The load-bearing rule: with no `AIProvider` mounted, `useAI()` returns `undefined` and `trigger()` is a no-op, so every AI affordance is inert, not broken.** A component's AI feature is always an opt-in prop (`aiRewrite`, `aiSearch`, `aiExplain`, ...) that renders nothing when unset, and all AI stories/tests run against a mock deterministic `AIClient` — no real key or `import.meta.env`/`process.env` usage exists anywhere in `src/`, and adding that convention is its own deliberate task.

**Cross-component CSS reuse**: components routinely import another component's `.module.css` directly (e.g. `import buttonStyles from '../Button/Button.module.css'`) rather than duplicating shared box/typography styles. Two hazards to check before doing this:

1. A reused rule must be self-contained, not a descendant selector depending on an ancestor class the reusing component doesn't have (silently matches nothing — no error).
2. When overriding an imported rule from your own module, a same-specificity single-class override is import-order-dependent; use a doubled-class selector (`.foo.foo { ... }`) scoped to your own module to reliably win regardless of load order.

**Design tokens**: every color/spacing/radius/shadow/font/motion/z-index value must reference a `--ds-*` custom property from `src/styles/variables.css` — never a raw literal, and never a fallback like `var(--ds-color-x, #fff)` when the token already exists unconditionally. `variables.css` is the only file that should ever change if the real `@mellon-design/tokens-web` package (published on npm, see `package.json`'s `dependencies`) revises its own tokens — component code and markup never reference a Foundation token name directly. Variant props (`size`/`variant`/`color`) are applied as `data-*` attributes with CSS attribute selectors (`.button[data-variant='primary']`), not modifier classes.

**The Foundation package** (`@mellon-design/tokens-web`, generated by the sibling `mellon_designsystem_foundation` repo) is two layers, and which one a value lives in decides who owns a change:

- **Primitives** (`css/tokens.css`, ~745 tokens): 15 hue families × 12 steps (25→950) in OKLCH, plus spacing, radius, border-width, opacity, motion, elevation, typography, z-index, sizing, grid. Theme-independent.
- **Semantic roles** (`css/theme-{light,dark,high-contrast}.css`, 40 roles each): surface/text/border/accent/status. This is the layer `variables.css` should map from wherever a semantic role exists.

Facts about it that are non-obvious and have already caused wrong conclusions:

1. **OKLCH `L` is held constant across all 15 families at each step** — every family's step 600 is exactly `L=0.54`. Generated by `generate-color-primitives.mjs`, guarded by `tests/build/color-primitives.test.mjs`. Correct for UI (a border swapped blue→red keeps its visual weight) but **actively harmful for any palette that must survive colorblind simulation**, because CVD collapses the hue axis and leaves lightness as the primary surviving channel. Same-step palettes collapse toward one color. Categorical palettes must stagger steps deliberately.
2. **`theme-high-contrast.css` is not grayscale.** 22 of its 40 roles retain chroma; every status family keeps its hue at high steps. Only `surface.*`/`text.*`/`border.*` are achromatic, and only because they alias the `gray` family (generated at `peakChroma: 0.0`). The theme is _neutral chrome + high contrast + hue where hue carries meaning_ — so a new role that carries meaning through hue should keep it in HC, not strip it.
3. **Three families are effectively achromatic** — `gray` (0.0), `neutral` (0.005), `slate` (0.022) — leaving **12 usable chromatic families**.
4. **`variables.css` maps only 74 of 745 tokens.** `border-width` and `opacity` are shipped upstream but never aliased, which is why raw `1px`/`2px`/`opacity: 0.6` still appear in component CSS. Check whether a token already exists upstream before declaring a gap.

Standing gaps and audit findings live in `docs/TOKEN_AUDIT.md`, `docs/CHART_TOKEN_REQUIREMENTS.md`, and `docs/icons.md`; the first two carry reproduction commands, the third tracks consumer-surfaced icon needs. Verify a token still exists (or an icon is still missing) before citing any of them.

**Icon library**: `@mellon-design/icons` is now a real `dependencies` entry (superseding the old "no icon library" rule — that rule held through `0.6.0` and is intentionally reversed as of the `Button.icon` work). Icons _owned by a specific component_ are still authored as inline SVG and exported only when another component reuses the exact shape (e.g. `AlertVariantIcon` shared by `Alert`/`Banner`/`Toast`, `Video`'s transport icons) — that half of the rule is unchanged. What changed is icons a **consumer** supplies through an existing slot prop (`Button.icon`, `IconButton`'s children, `Badge`/`Tag`/`Timeline`/`TreeView`/`Sidebar`/`NavigationRail`/`BottomNavigation`/`EmptyState`/`CommandPalette`/`SlashCommandPicker`/`StatusLine`'s `icon`): those may now come from `@mellon-design/icons` directly, demonstrated in `Button.stories.tsx`'s and `IconButton.stories.tsx`'s `FromMellonIconsPackage` stories. Real consumer icon needs are tracked in `docs/icons.md`; read it before adding a new _component-owned_ shared icon export (that half of the old rule — no standalone, no-owning-component inline SVG — still applies).

**DOM-owned editing surfaces**: `RichTextEditor` is the one component where the DOM, not React, owns its children — a `contentEditable` div driven by `document.execCommand`, with `value`/`defaultValue` still going through `useControllableState` so it behaves like every other form control from outside. Consequences that bite: React must never re-render the editable subtree from state (that would blow away the selection), the toolbar reads state via `document.queryCommandState` (feature-detected — jsdom doesn't implement it), and the link popover's URL input steals focus, so the editor's `Range` is saved on blur and restored immediately before `execCommand('createLink', …)`. Don't reach for this pattern anywhere else without the same care.

**"Thin wrapper" preset pattern**: some components are a fixed-props layer over a more general one rather than a separate implementation — `TimePicker` over `Select`, `Autocomplete` over `Combobox` (`allowFreeText` fixed `true`), `PinInput` over `OTPInput` (`mask` fixed `true`). Fixed props go after the prop spread (non-overridable); defaulted-but-overridable props go before it.

## Standing design rules

**No nested overlay boxes** ("dropdown inside a dropdown"). If a component reuses `Popover.Content` (or any other already-fully-styled overlay wrapper — border/background/shadow/padding), its own inner content must stay bare and rely on that outer box's chrome, not render a second full box inside it. Bug precedent: `Select`/`MultiSelect`'s `.listbox` used to duplicate `Popover.Content`'s border/shadow/padding, producing a visible double border. Fix pattern: keep the inner element to layout-only rules (e.g. `max-height`/`overflow-y`), and if the outer wrapper's default padding doesn't fit, override it with a doubled-class selector scoped to your own module (e.g. `.content.content { padding: ...; }`) rather than adding a second box.

**Strictly use design tokens — no hardcoded or inline values.** Every color, spacing, radius, shadow, font, motion, and z-index value must come from `--ds-*` tokens, never a raw hex/rgb color, a hand-rolled `box-shadow`, or a fallback literal like `var(--ds-color-x, #fff)` when the token already exists unconditionally in this codebase. Bare pixel values are acceptable only for genuinely component-intrinsic fixed geometry with no matching token (e.g. a checkbox's own box size) — prefer an existing token whenever one fits.

**Status color is never the sole carrier of meaning.** Any component whose `color`/`variant` makes a semantic claim (`success`/`warning`/`danger`, as opposed to the presentational `neutral`/`brand`) must ship two extra channels alongside the hue: a visible `AlertVariantIcon` for sighted users who can't separate red from green, and a `<VisuallyHidden>` status word for screen readers, which get no color at all. `Badge` and `Tag` are the reference implementations — both take `icon?: ReactNode | false`, defaulting to the variant icon for the three status colors only, where `icon={false}` suppresses the hidden status word too and is legitimate _only_ when the visible text already names the status (`<Badge color="danger">Failed</Badge>`). This isn't a preference: `docs/TOKEN_AUDIT.md` Part F validates the Foundation's status palette on the explicit assumption that consumers do this.

## Kanban board & the structured-command layer

`KanbanBoard`/`KanbanColumn`/`KanbanCard` + `KanbanPromptBar`/`KanbanChangePreview` (both phases shipped, `docs/SPEC.md` phase 28). Two things here generalize beyond Kanban and are worth reading before building anything similar.

**One pure reducer, two input paths.** `applyKanbanCommands` (`src/utilities/kanbanReducer.ts`) is the only way the board changes — pointer drag, keyboard move, and AI command all funnel through it, so they cannot drift apart on index semantics. It **validates as it goes and drops-and-reports** rather than throwing: commands are checked against the board _as of that point in the sequence_, so a `create` followed by a `move` of the card it just created both succeed, while a hallucinated id becomes a reported rejection instead of a half-mutated board. Board data is normalized (`columns` + a `cards` record) with order on `column.cardIds`, which is what makes a move a list splice.

**The AI layer is the first one in this repo that mutates structured state**, not text — every other affordance turns a `string` into prose, a field value, or an answer. Consequences worth internalizing:

- **`AIClient` was deliberately not widened.** Structured output is Kanban-local: the library owns the `KanbanCommand` vocabulary and its validator, the consumer owns transport via a `resolveCommands` prop. Adding an `act()`/structured method to `src/contexts/AIContext.ts` would touch a contract 26 components depend on — don't, without deciding that separately.
- **Responses are classified by blast radius**, not handled uniformly (`useKanbanCommands`): no commands → an answer that highlights and mutates nothing; one non-destructive command → applied with an undo `Toast`; more than one, or any `delete` → staged in `KanbanChangePreview`. Uniform handling fails in both directions — it makes a read-only question pop a confirmation dialog, and lets a bulk request rewrite dozens of cards unseen.
- **Validation runs on every path, including the consumer's own resolver.** A model that hallucinated an id is not more trustworthy for having come through someone else's transport.
- **Unparseable prose becomes a `message`, not an error** (`parseKanbanResolution`). A model answering "what's blocked?" in plain English has done the right thing; the cost is that a genuinely broken response also surfaces as text, which is the safe direction since nothing touches the board.
- **`@` in the prompt bar resolves a card to its id client-side** (via `useFloatingListPicker`), removing the hardest entity-resolution case from the model entirely — two similar titles and a confident guess between them is how boards get corrupted.
- **The prompt payload is budgeted and deterministically truncated** (`kanbanSnapshot`): every column always appears (a column the model can't see is a destination it can't use), cards drop from the end, and the omitted count goes into the prompt. An unbounded serializer is a silent failure at ~200 cards.

Two deviations from the usual conventions, both deliberate: `aiPrompt` renders when there's an `AIProvider` **or** a `resolveCommands` — supplying a resolver is itself an explicit opt-in, so it's a slight widening of the "AIProvider is the switch" rule (with neither, markup is byte-identical to the non-AI board, and a test asserts it). And undo reads `ToastContext` directly rather than calling `useToast`, which **throws** outside its provider — an optional affordance must never be the reason a component can't mount. Without a `ToastProvider` the change still applies and is announced through the board's live region.

Keyboard moves are a first-class path, not a fallback, precisely because the prompt bar is inert without a provider and so can never be the accessibility story. Note that moving a card across columns re-parents its `<li>` and drops focus to `<body>`; the board re-focuses the lifted card after each applied move, without which a keyboard user is stranded after one arrow press. `useRovingFocus` does **not** fit a board — it's a flat 1-D list and can't express "left/right changes column, up/down changes position", so `KanbanBoard` has its own 2-D navigation.

## Canvas — DOM-based workspace (phase 1 shipped)

`Canvas` + `CanvasBlock`/`CanvasConnector`/`CanvasOutline` + `StickyNote`/`CanvasShape`/`CanvasEmbed`/`CanvasFrame`, backed by `useCanvasViewport`, `applyCanvasCommands` (`src/utilities/canvasReducer.ts`) and `src/utilities/canvasGeometry.ts`. `docs/SPEC.md` phase 29; all five phases have shipped — workspace, prompt pipeline, `aiCluster`, `aiDiagram`, and the block catalogue.

**This reopened a documented exclusion, deliberately.** `docs/COMPONENT_LIST.md` had Canvas/Workspace out of scope as needing "a full canvas engine". That's true of `<canvas>` and false of DOM: blocks are absolutely-positioned real elements inside one transformed world div, so every component can be a block, tokens and all three themes apply for free, and blocks stay focusable. **Freehand ink is still excluded** and is the one item the old reasoning got right. Don't "restore" the exclusion wholesale — the doc now records which parts shipped and why ink didn't.

Things here that generalize:

- **Don't hide a spatial layer wholesale — hide only what has no text.** The canvas originally made the whole world `aria-hidden` and treated `CanvasOutline` as a chart-style table twin. Wrong analogy: a chart's SVG is paths, but canvas blocks hold real content _and real controls_, so the moment notes gained an AI trigger it put focusable buttons inside an `aria-hidden` subtree — a violation, not a trade-off. Now blocks are labelled groups in the tree, only the connector SVG is hidden, and the outline is a _navigation aid_ (reading order + the connector graph as text) rather than a substitute. A `frame` block defers labelling to `CanvasFrame` so nested groups don't announce the same name twice.
- **An a11y test only covers what it renders.** Nothing caught the above because no test enabled `aiRewrite` with an `AIProvider`. When a component gains an opt-in that adds interactive DOM, add an `expectNoA11yViolations` case with that opt-in _on_.
- **Geometry is pure and never measures the DOM.** Connector routing works from stored canvas rects, which is what makes it unit-testable at all: jsdom has no layout engine and `getBoundingClientRect` returns zeros, so anything DOM-measured would be untestable precisely where the bugs are. Pan/zoom/marquee/drag still need `pnpm test:storybook` or a Playwright script.
- **One transform carries the viewport**, so blocks store plain canvas coordinates and never know pan or zoom exist; pointer positions convert once at the boundary (`useCanvasViewport.toCanvas`). Portal overlays land correctly without special casing because `usePositioning` measures through ancestor transforms.
- **`Omit` over a discriminated union collapses to the shared keys.** `Partial<Omit<CanvasBlockData, 'id'|'kind'>>` silently made a sticky note's `text` unpatchable; the fix is a distributive conditional (`CanvasPatch`). Worth remembering for any union-shaped patch type.
- **A pan gesture must bubble past blocks.** Alt/middle-drag is checked _before_ a block stops propagation — otherwise panning is impossible anywhere the canvas is actually full, which is when you need it.
- **Alt+arrows resize.** That's what lets the eight pointer resize handles stay `aria-hidden` instead of adding eight tab stops per block.

Phase 2 (shipped) adds the prompt pipeline — `CanvasPromptBar`, `CanvasChangePreview`, `useCanvasCommands`, `canvasSnapshot`, `parseCanvasResolution` — as direct analogues of the Kanban Phase B files, same classify-by-blast-radius policy. Two canvas-specific differences: **a lone `create` applies immediately** (additive and trivially undone; anything touching existing content stages), and **geometry is prompt content**, with the scene's occupied bounds included so a model doesn't stack every generated block at `0,0`. The change preview describes commands against the scene _plus the batch's own creates_, or a "connect these two new notes" batch reads as raw ids.

Phase 3 (shipped) adds `aiCluster` — affinity mapping — as `src/utilities/canvasClusters.ts` plus a trigger on `Canvas`. Three things about it generalize:

- **Ask the model what belongs together, never where to put it.** The response is titles + member ids; `clusterCommands` owns the geometry — a grid per frame, cell sized from the largest member, the band placed clear of everything that isn't moving, and no block ever resized. Coordinates are the part a model is worst at and the part that is trivially deterministic here, which is the same trade `@`-mention resolution makes on the prompt bar. It also keeps the whole layout unit-testable, which DOM-measured placement would not be.
- **It shares `useCanvasCommands`' single in-flight slot and single outcome** rather than owning its own state. That's what makes a cluster land in the same `CanvasChangePreview`, under the same blast-radius policy, with the same undo — a parallel pipeline would have needed a second review panel and a rule for what happens when both resolve at once. Clustering always stages: it moves content the user arranged themselves.
- **Semantic drops are reported in the `message`, not as `rejected`.** A hallucinated id or a note claimed by two groups isn't a command, and inventing one to report it would put a fake change in the preview. `rejected` stays what `applyCanvasCommands` produced.

Phase 4 (shipped) adds `aiDiagram` — describe a flow, get shapes and connectors — as `src/utilities/canvasDiagram.ts`. It's the same "model supplies meaning, library supplies geometry" split, and it settles two things:

- **The blast-radius line is about what a batch touches, not how big it is.** Clustering always stages (it rearranges the user's own arrangement); a generated diagram applies with an undo (it adds content and touches none). `isPurelyAdditive` checks that claim rather than trusting the generator, and anything failing it falls back to the review panel. The prompt path's multi-create batches still stage, because there the model chose the geometry and the batch can mix in moves and deletes.
- **Ranking needs a DAG, so `breakDiagramCycles` runs first.** A retry edge back to a decision otherwise drags that decision below every step it feeds and the flow reads bottom-up — found in the browser, invisible to jsdom. Back edges are excluded from ranking and still drawn, which is where a reader expects a loop. Ranks are then compacted to consecutive numbers, or a gap becomes a band of empty canvas. `role` (start/decision/process/…) maps to the shape vocabulary in the library, because whether a step branches is a fact about the process while "decisions are diamonds" is a drawing convention.

Two Phase 1 defects surfaced only once generated content started living inside frames, both fixed in phase 4: **the connector `<svg>` painted under every block**, so a frame covered every edge inside it — connectors now render between the frame band and the content band — and **a filled frame used `surface-secondary`, the same fill a clipped `CanvasShape` uses**, so a diamond on a frame was invisible. A frame is now an unfilled boundary (dashed edge + title), which is also what it always claimed to be.

Phase 5 (shipped) completes the block catalogue — `code`, `table`, `link`, `checklist`, `chart` — and reworks navigation. Four things generalize:

- **A kind gets a component only when it has behaviour.** Four of the five are delegation to `Code`/`Table`/`Link`/`ChartSurface`; only `checklist` is new, because it is the one face with state of its own, and even that state goes out as an `update` command so a hand-tick and a model's tick share one path.
- **A press on a control inside a draggable block must not take pointer capture.** A captured pointer never delivers its click, which is exactly how a checklist's boxes silently stopped ticking. Capture is now taken in `onPointerMove` once the drag passes its threshold, and `INTERACTIVE_IN_BLOCK` (`a[href], button, input, select, textarea, label, [contenteditable]`, plus the old `data-canvas-block-actions` marker) never starts a drag at all — `label` included, or dragging a row ticks its box on release. Such a block is dragged by its title or padding.
- **React registers wheel listeners as passive**, so `preventDefault` in an `onWheel` prop does nothing and the page scrolls away underneath the gesture. The canvas binds `wheel` natively with `{ passive: false }`. Plain wheel/trackpad pans both axes, Shift pans sideways (a mouse reports only `deltaY`), Ctrl/Cmd zooms about the pointer.
- **Viewport navigation is a keyboard feature, not a pointer one.** With nothing selected the arrows pan (Ctrl/Cmd forces it even with a selection), `+`/`-` zoom, `0` resets, `1` fits, PageUp/PageDown jump — all available under `readOnly`, because looking around is not editing. Zoom is announced as a percentage; a silent transform is invisible non-visually.

The painted grid is gone. The surface is `--ds-color-surface-secondary` (the only recessed neutral the Foundation exposes as a role) and every block face moved to `--ds-color-surface-primary`, so blocks read as sitting _on_ the workspace rather than dissolving into it. `showGrid` was removed; the unrelated `grid` prop (snap spacing) stays.

`CanvasEmbed` sandboxing is a security invariant with a test guarding it: iframe with `allow-scripts` and deliberately **no** `allow-same-origin` (the pair together defeats the sandbox — the frame could strip its own attribute), never `dangerouslySetInnerHTML`. Note/shape `tone` is one of the five semantic roles and is decoration only; a wider whiteboard palette is blocked on the same Foundation gap as chart series colour.

## Chart track — in progress

A data-viz track is underway. Full requirements in `docs/CHART_TOKEN_REQUIREMENTS.md`; read it before touching chart color.

**Shipped so far:**

- **Chart tokens** in `variables.css`. Geometry (`--ds-chart-stroke-width`/`-mark-radius`/`-gap`/`-marker-size`) is **final** — it aliases existing primitives so a chart's 2px segment gap reads as intent, not a stray border. Furniture (`--ds-chart-surface`/`-axis`/`-grid`/`-tick-label`/`-crosshair`/`-annotation`/`-de-emphasis`) is **interim**, mapped onto the nearest UI roles until the Foundation ships real data-viz roles; two known compromises are flagged inline in the file.
- **`--ds-border-width-*`** — all five now mapped (closes `docs/TOKEN_AUDIT.md` B1). Prefer these over raw `1px`/`2px` in any new CSS.
- **`useChartScale`** (`src/hooks/`) — band + linear scales with nice-tick rounding, hand-rolled per the no-charting-library precedent. `includeZero` defaults `true`; a bar chart with a clipped baseline is the most common way a chart misleads.
- **`ChartContainer`** — the `<figure>` every chart mounts in. Owns the caption and the **accessible table twin**, which is not optional: a chart's SVG is `aria-hidden`, so the `<table>` _is_ its accessible content. Default is always-present-but-visually-hidden; `tableToggle` makes it a visible swap, with the plot `hidden` rather than unmounted so flipping doesn't discard hover/selection state.
- **`resolveChartFrame` / `DEFAULT_CHART_MARGIN`** (`useChartScale.ts`) — splits an outer chart box into gutters plus the inner plot the scales map onto. The margin numbers are text-metric allowances (room for a tick label), not design values: no spacing token means "as wide as four digits", and an SVG attribute can't read a custom property anyway.
- **`ChartAxis` / `ChartGrid`** — the shared chrome, deliberately dumb about scales. The caller converts data into `{ position, label }` pairs, so one component serves both the linear value axis and the categorical band axis. Label gutters are CSS transforms rather than `dx`/`dy` attributes, which is what keeps that spacing tokenized.
- **`BarChart` / `LineChart`** — single-series, composing all of the above. `width`/`height` are the **viewBox coordinate space, not a pixel size**: the plot scales to its container as a unit (`width: 100%; height: auto`), so those props set the aspect ratio and the stroke-to-label proportion. `ChartSurface`'s `preserveAspectRatio="none"` is the anti-pattern being avoided — it stretches strokes and text unevenly.

- **`ChartTooltip` / `ChartDataLabel`** — the interaction chrome, both wired into the charts (`showTooltip`, on by default; `showDataLabels`, off; `renderTooltip` to replace the body). `ChartTooltip` anchors in **percentages of the plot box, not pixels** — the SVG scales with its container, so a pixel offset would drift on resize while a percentage of the same box tracks it exactly, with nothing to measure and no `ResizeObserver`. `ChartDataLabel` only ever sits _outside_ its mark: in-bar labels need the `-on` contrast roles the Foundation hasn't shipped, so that placement is absent rather than approximated.
- **`ChartSurface`** is now a thin preset over the two charts (roadmap step 2, done) — it picks a component from a `type` string, which is the shape a runtime-driven call site like an AI chat response needs. It had been a parallel implementation with its own scale math and its own copy of the table-twin pattern.
- **`aiExplain`** also lives on `ChartContainer` (`ChartAIProps`), so every chart inherits the AI affordance the same way it inherits the table twin — read-only, following `Alert`'s explanation shape rather than the rewrite/accept shape, since a chart's data belongs to the caller. Unlike `Table`, which must scrape its rendered DOM, the prompt is built from the `data` prop directly and the series also rides along on the `context` bag. Values go through the chart's own `formatValue` so the prompt reads in the same units as the axis, and a non-finite reading is stated as `no data` rather than `NaN` — the same refusal to invent a measurement that makes `LineChart` break its line at a gap.

Three behaviours that are load-bearing rather than incidental: a non-finite value is **dropped from the plot but kept in the table twin**, so bad data surfaces instead of vanishing; in `LineChart` it **breaks the line into separate polyline segments** rather than being bridged, because interpolating across a missing reading invents a measurement nobody took; and pointer **hit areas span the whole category slot including its gutter** (`BandScale.slotWidth`, not `bandWidth`), or a pointer between two bars falls into a dead gap and dismisses the readout.

`BarChart` deliberately draws **no crosshair** where `LineChart` does: a bar already spans the full distance from baseline to value, so a vertical rule adds ink without adding a reading. It outlines the hovered bar instead. Nothing dims the _other_ marks in either chart — de-emphasis needs a gray this system can't yet name for series marks (`--ds-chart-de-emphasis` is furniture, and the categorical roles are the Foundation gap).

`--ds-chart-marker-size` is applied as an `r` **attribute**, not the CSS `r` geometry property — that property's fallback is `0`, so an unsupported token would erase every marker. `--ds-chart-mark-radius` does go through CSS `rx`, where the fallback merely squares a corner.

**The hard constraint — only single-series charts can be built.** `variables.css` deliberately defines **no categorical, sequential, or diverging series color**, because per-theme palette selection cannot be derived from UI roles and inventing values in a mapping-only file breaks the contract that a Foundation revision touches nothing else. `--ds-chart-primary` (the accent hue) covers one series, which is legitimate — the chart's title names it, so no palette is needed. **Do not add series colors to `variables.css`**; the comment block there says so explicitly.

When the palette does land, two rules from the requirements doc bind: **5 slots are safe on color alone** — slots 6–8 need texture, direct labels, or shape in every theme — and separation is validated **all-pairs**, never adjacent-pairs (a legend shows every slot at once).

**Next steps, in order:**

1. **Blocked on the Foundation palette** — and this is now the whole remaining list: multi-series, `AreaChart` stacked, `Heatmap`, `ScatterPlot`, the diverging forms, `SmallMultiples`, and `ChartLegend`. The legend is deferred for the same reason rather than skipped: a single-series chart is named by its own caption, so a legend has exactly one entry and nothing to disambiguate until there is a palette to disambiguate.
2. Not blocked, but not started: keyboard access to the plot. Today the charts are pointer-only by design — the SVG is `aria-hidden` and the table twin is the accessible content, so a keyboard user reads the table rather than the marks. That is defensible and complete, but a focusable plot with arrow-key traversal would be a real improvement over it.

Chart geometry is invisible to jsdom — no layout engine, so scale math is unit-testable but rendered marks are not. Verify plots via `pnpm dev` or `pnpm test:storybook`.

## AI Chat surfaces (phases 23–27, all shipped)

The largest single cluster — 22 components under the `AI`/`AI Chat` story categories (`MessageBubble`, `MessageActionBar`, `MessageMeta`, `ConversationHeader`, `ThinkingBlock`, `ToolTraceViewer`, `CitationCard`/`CitationMarker`, `StatusLine`, `StreamingCursor`, `TypingIndicator`, `TokenCounter`, `FeedbackControl`, `CodeBlockToolbar`, `MentionPicker`, `SlashCommandPicker`, `PromptTemplatePicker`, `AISuggestionPopover`, `AITriggerButton`, `MemoryEditor`/`MemoryListItem`, …). They are chat-conversation _chrome_, not a chat engine: none of them talks to `AIContext`, none owns conversation state, and there is no `<Chat>` root that composes them. The consuming app assembles the conversation and feeds each piece props — the same "component stays dumb, consumer owns transport" split `AIClient` draws.

What generalizes:

- **Slots, not baked-in opinions.** `MessageBubble`'s `avatar`, `ConversationHeader`'s `participants`/`actions` are `ReactNode` slots rather than props that reach for `AvatarGroup`/`Button` — a chat shell has no business fixing those choices for the app.
- **Exactly one live region per announced moment.** `StatusLine` is `role="status"` (a one-time "Searching the web…" transition worth announcing) and so is `TypingIndicator` (mirroring `Spinner`'s shape). `StreamingCursor` and `TokenCounter` deliberately are **not** — the streaming text beside the cursor already carries its own `aria-live`, and announcing a token count on every keystroke would spam assistive tech. Nesting a second `role="status"` inside `StatusLine` double-announces. Check what already announces before adding a region.
- **No tokenizer is bundled.** `TokenCounter` estimates `~length / 4` and says so. That's the same vendor boundary `AIClient` draws for completions — an approximate number the consumer can override beats shipping a dependency.
- **`MemoryListItem` is a bare `<li>`** meant to live in a consumer-supplied `<ul>`; `MemoryEditor` wraps a real `<form onSubmit>` so Enter-to-submit works via the platform rather than a hand-rolled keydown handler. Draft text is local state; only committed `onAdd`/`onForget` calls reach the consumer.
- **Test-tooling gotcha found here**: `userEvent.type()` with a `{ArrowDown}{Enter}` sequence delegated through a ref-exposed `handleKeyDown` intermittently loses the state update before the next assertion. Use `fireEvent.keyDown` wrapped in `act()` for that specific delegated-ref + rapid-sequence shape; `userEvent`'s special-key syntax is fine elsewhere.

Model/generation controls (temperature, tool-permission toggles) intentionally have **no** component — `Select`/`Slider`/`Switch`/`FormGroup` already cover them, and they exist as Storybook composition only.

## Testing

- Unit/interaction/a11y/keyboard tests via Vitest + React Testing Library; accessibility assertions use `expectNoA11yViolations` (`tests/axe.ts`, backed directly by `axe-core`) — `color-contrast` and `region` rules are disabled there (jsdom has no layout engine; contrast is a `pnpm test:storybook` concern, and `region` false-positives on components rendered without page landmarks).
- jsdom gaps to work around: no `PointerEvent` constructor (dispatch a `MouseEvent` typed `'pointerdown'`/etc. via `fireEvent`, not raw `dispatchEvent`, so the update stays `act()`-wrapped); no `Element.prototype.scrollIntoView` (feature-detect: `el?.scrollIntoView?.(...)`); `setPointerCapture`/`releasePointerCapture` are feature-detected in `usePointerDrag` for the same reason.
- `fireEvent.focus()` only dispatches the synthetic event — `document.activeElement` doesn't move. Use a real `element.focus()` call (wrapped in `act()` if it triggers a state update via the component's own `onFocus`) when a test needs `toHaveFocus()` to mean anything.
- Portal-rendered components (`Dialog`, `Drawer`, `Toast`, any overlay) mount into `document.body`, not the `render()` container — query via `screen`/`document`, never `container.querySelector`.
- Known pre-existing `pnpm test:storybook` failures: `Badge`, `Chip`, `CircularProgress`, `Progress`, `LoadingOverlay` fail the real-browser `color-contrast` check and have across several phases. Don't assume your change caused them — but don't paper over a _new_ one either. A state that's deliberately low-contrast because it's inactive should carry `aria-disabled` so axe-core applies the WCAG 1.4.3 exemption instead of flagging it (see `Text.stories.tsx`'s `Colors` story).
- `.storybook/preview.tsx` sets `parameters.a11y.test = 'error'`, so every story is an axe assertion under `pnpm test:storybook` — a new story is a new a11y gate, not just a demo.
- Story `title` prefixes must match a category in `preview.tsx`'s `storySort.order` or the story silently sorts to the end alphabetically. The list must stay an inline array literal (Storybook parses the file's AST without executing it; a hoisted const fails silently). Add a category there when introducing one — `Board` and `Canvas` were added this way. **Still unfixed**: `AI` (2 stories), `AI Chat` (20), and `Charts` (7) are in use but absent from the list, so 29 story files sort to the end today. Verify current state with:

  ```bash
  grep -rho "title: '[A-Za-z ]*/" src --include=*.stories.tsx | sort -u
  ```

- Dark mode and RTL are not per-component stories — the global toolbar in `.storybook/preview.tsx` applies both to every story. Don't add per-component variants for them.
- `vi.useFakeTimers()` combined with `userEvent` deadlocks (userEvent's internal awaits depend on real timers even with `advanceTimersByTime`); use `fireEvent` instead when a test needs both fake timers and a click.
