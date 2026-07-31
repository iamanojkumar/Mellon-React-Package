# react-design-system

Production-grade React + TypeScript component library. Built now against
placeholder CSS-variable design tokens so component APIs, accessibility,
and DX can mature ahead of the separate Design System Foundation package
(`@company/tokens-web`). Full scope and rationale: [docs/SPEC.md](./docs/SPEC.md).

## Getting started

```bash
pnpm install
pnpm dev              # Storybook dev server on :6006
pnpm test             # Vitest + React Testing Library
pnpm lint              # ESLint
pnpm typecheck         # tsc --noEmit
pnpm build             # Vite library build -> dist/
```

## Structure

```text
src/
├── components/   # One folder per component: impl, styles, tests, stories, exports
├── hooks/        # Reusable hooks (useDisclosure, useControllableState, ...)
├── contexts/     # React Contexts (Theme, Toast, Direction, ...)
├── providers/    # ThemeProvider, PortalProvider, ToastProvider, ...
├── styles/       # Global CSS variables, reset, base styles — no component styling here
├── utilities/    # mergeClasses, composeRefs, a11y/DOM helpers
├── icons/        # Individually importable, tree-shakeable icons
├── animations/   # Motion utilities referencing --ds-motion-* tokens, never hardcoded values
└── types/        # Polymorphic types, shared props, event/utility types
```

## Styling

Every value comes from a `--ds-*` CSS variable defined in
[`src/styles/variables.css`](./src/styles/variables.css), with a fallback
so components render correctly today:

```css
padding: var(--ds-space-md, 1rem);
```

When `@company/tokens-web` ships, only `src/styles/variables.css` changes —
component logic and markup do not.

## Build order

New components are built in dependency order, not alphabetically:

1. **Core Primitives** — `Box` (done), `Flex`, `Grid`, `Stack`, `Text`, `Heading`, `Portal`
2. **Foundation Components** — `Button`, `Input`, `Field`, `Card`
3. **Composite Components** — `Tabs`, `Dialog`, `Dropdown`, `Table`, `DatePicker`

See the full component inventory and per-component checklist in
[docs/SPEC.md](./docs/SPEC.md).

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  (enforced by commitlint on `commit-msg`).
- Every user-facing change needs a changeset: `pnpm changeset`.
- `pnpm lint-staged` runs ESLint + Prettier on staged files via a pre-commit hook.
