# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the Mellon React design-system component library. `docs/SPEC.md` is the living source of truth for build order, shipped components, and per-component design decisions — read it before starting new work.

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
pnpm build                  # tsc --noEmit && vite build -> dist/
pnpm test:storybook         # builds Storybook, serves it, runs @storybook/test-runner (Playwright + axe-core) against every story — the only real-browser check (contrast, live pointer/drag behavior); jsdom-based `pnpm test` can't catch these
pnpm generate:component <Category> <Name>   # scaffolds the standard 5-file set + adds the export to src/components/index.ts
```

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

**Context/Provider/Hook split**: a stateful cross-cutting concern is `XContext.ts` (the `createContext` call + types) + `XProvider.tsx` (`src/providers/`) + `useX.ts` (`src/hooks/`, throws if used outside its provider) — see `ThemeContext`/`ThemeProvider`/`useTheme` as the reference shape, extended by `ToastContext`/`ToastProvider`/`useToast`. A provider that also renders real UI (not just a side effect like `ThemeProvider`'s `data-theme` attribute) colocates its visual pieces under `src/components/<Name>/` while the context/provider/hook stay in their own top-level folders; internal-only rendering pieces (e.g. `ToastItem`) are not exported from `src/components/index.ts`.

**Polymorphic components**: `PolymorphicComponentPropWithRef<C, OwnProps>` (`src/types/polymorphic.ts`) backs any component with an `as` prop (see `Box.tsx`). Because `children` or another prop is sometimes required on `OwnProps`, `forwardRef`'s generic inference breaks — the established workaround is casting the render function to a hand-written component type (`as unknown as XComponent`) and setting `displayName` via `(X as any).displayName = 'X'` afterward (see `Box`, `Heading`, `AvatarGroup`, `IconButton`).

**Compound components**: root + parts, e.g. `<Dialog><Dialog.Header>...</Dialog.Header></Dialog>`. Each part is its own function component; the root attaches them via `Object.assign(Root, { Part1, Part2, displayName: 'Root' })` in one call (assigning `displayName` afterward doesn't typecheck against a `forwardRef`-cast component). Parts are also individually named-exported. Some compound components share parts directly across trees rather than reimplementing — `Drawer.Header`/`Body`/`Footer` are literally `Dialog`'s own part components, imported and re-assigned.

**Overlay infra, reused rather than rebuilt per component**: `Portal` (renders synchronously into `document.body`, no ref — it relocates children rather than wrapping them), `usePositioning` (wraps `@floating-ui/dom`, accepts a `RefObject` or a virtual element for click-point positioning), `useFocusTrap`/`<FocusTrap>`, `useClickOutside`/`useEscapeKey`, and `Popover` (`Popover.Trigger`/`Popover.Content`, click or hover trigger modes) as the shared trigger+panel+positioning+dismiss primitive most later overlays (`Select`, `Combobox`, `Dropdown`) compose — except where `Popover.Trigger`'s hardcoded popup ARIA semantics (`aria-haspopup="dialog"`, etc.) would be wrong for the pattern (e.g. `Tooltip`, which needs `aria-describedby`/`role="tooltip"` instead and so reuses `Popover`'s underlying hooks directly rather than its JSX).

**Cross-component CSS reuse**: components routinely import another component's `.module.css` directly (e.g. `import buttonStyles from '../Button/Button.module.css'`) rather than duplicating shared box/typography styles. Two hazards to check before doing this:

1. A reused rule must be self-contained, not a descendant selector depending on an ancestor class the reusing component doesn't have (silently matches nothing — no error).
2. When overriding an imported rule from your own module, a same-specificity single-class override is import-order-dependent; use a doubled-class selector (`.foo.foo { ... }`) scoped to your own module to reliably win regardless of load order.

**Design tokens**: every color/spacing/radius/shadow/font/motion/z-index value must reference a `--ds-*` custom property from `src/styles/variables.css` — never a raw literal, and never a fallback like `var(--ds-color-x, #fff)` when the token already exists unconditionally. `variables.css` is the only file that should ever change when the real `@mellon/tokens-web` package (currently linked locally from the sibling `mellon_designsystem_foundation` repo) is published — component code and markup never reference a Foundation token name directly. Variant props (`size`/`variant`/`color`) are applied as `data-*` attributes with CSS attribute selectors (`.button[data-variant='primary']`), not modifier classes.

**No icon library** — every icon is a small inline SVG; shapes used by multiple components are exported once and reused (e.g. `AlertVariantIcon` shared by `Alert`/`Banner`/`Toast`).

**"Thin wrapper" preset pattern**: some components are a fixed-props layer over a more general one rather than a separate implementation — `TimePicker` over `Select`, `Autocomplete` over `Combobox` (`allowFreeText` fixed `true`), `PinInput` over `OTPInput` (`mask` fixed `true`). Fixed props go after the prop spread (non-overridable); defaulted-but-overridable props go before it.

## Standing design rules

**No nested overlay boxes** ("dropdown inside a dropdown"). If a component reuses `Popover.Content` (or any other already-fully-styled overlay wrapper — border/background/shadow/padding), its own inner content must stay bare and rely on that outer box's chrome, not render a second full box inside it. Bug precedent: `Select`/`MultiSelect`'s `.listbox` used to duplicate `Popover.Content`'s border/shadow/padding, producing a visible double border. Fix pattern: keep the inner element to layout-only rules (e.g. `max-height`/`overflow-y`), and if the outer wrapper's default padding doesn't fit, override it with a doubled-class selector scoped to your own module (e.g. `.content.content { padding: ...; }`) rather than adding a second box.

**Strictly use design tokens — no hardcoded or inline values.** Every color, spacing, radius, shadow, font, motion, and z-index value must come from `--ds-*` tokens, never a raw hex/rgb color, a hand-rolled `box-shadow`, or a fallback literal like `var(--ds-color-x, #fff)` when the token already exists unconditionally in this codebase. Bare pixel values are acceptable only for genuinely component-intrinsic fixed geometry with no matching token (e.g. a checkbox's own box size) — prefer an existing token whenever one fits.

## Testing

- Unit/interaction/a11y/keyboard tests via Vitest + React Testing Library; accessibility assertions use `expectNoA11yViolations` (`tests/axe.ts`, backed directly by `axe-core`) — `color-contrast` and `region` rules are disabled there (jsdom has no layout engine; contrast is a `pnpm test:storybook` concern, and `region` false-positives on components rendered without page landmarks).
- jsdom gaps to work around: no `PointerEvent` constructor (dispatch a `MouseEvent` typed `'pointerdown'`/etc. via `fireEvent`, not raw `dispatchEvent`, so the update stays `act()`-wrapped); no `Element.prototype.scrollIntoView` (feature-detect: `el?.scrollIntoView?.(...)`); `setPointerCapture`/`releasePointerCapture` are feature-detected in `usePointerDrag` for the same reason.
- `fireEvent.focus()` only dispatches the synthetic event — `document.activeElement` doesn't move. Use a real `element.focus()` call (wrapped in `act()` if it triggers a state update via the component's own `onFocus`) when a test needs `toHaveFocus()` to mean anything.
- Portal-rendered components (`Dialog`, `Drawer`, `Toast`, any overlay) mount into `document.body`, not the `render()` container — query via `screen`/`document`, never `container.querySelector`.
- `vi.useFakeTimers()` combined with `userEvent` deadlocks (userEvent's internal awaits depend on real timers even with `advanceTimersByTime`); use `fireEvent` instead when a test needs both fake timers and a click.
