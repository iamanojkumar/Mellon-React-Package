# @mellon-design/react

Production-grade React + TypeScript component library, styled entirely
through `--ds-*` CSS variables backed by the Design System Foundation
package ([`@mellon-design/tokens-web`](https://www.npmjs.com/package/@mellon-design/tokens-web),
published on npm — see `package.json`'s `dependencies`). Full scope
and rationale: [docs/SPEC.md](./docs/SPEC.md).

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
├── hooks/        # Reusable hooks (useTheme, useDisclosure, useControllableState, ...)
├── contexts/     # React Contexts (ThemeContext done; Toast, Direction, ...)
├── providers/    # ThemeProvider done; PortalProvider, ToastProvider, ...
├── styles/       # Global CSS variables, reset, base styles — no component styling here
├── utilities/    # mergeClasses, composeRefs, a11y/DOM helpers
├── icons/        # Individually importable, tree-shakeable icons
├── animations/   # Motion utilities referencing --ds-motion-* tokens, never hardcoded values
└── types/        # Polymorphic types, shared props, event/utility types
```

## Styling

Every value comes from a `--ds-*` CSS variable, mapped in
[`src/styles/variables.css`](./src/styles/variables.css) from
`@mellon-design/tokens-web`. Component CSS never uses a fallback (e.g.
`var(--ds-space-md, 1rem)`) — a token is always defined unconditionally
by the second import below.

Consumers need **two** CSS imports, not one:

```ts
import '@mellon-design/react/styles.css'; // component CSS — consumes --ds-*
import '@mellon-design/react/tokens.css'; // defines every --ds-* variable
```

`tokens.css` is optional if you already wire up your own `--ds-*`
definitions from `@mellon-design/tokens-web` directly — `styles.css` has
no dependency on it beyond the variable names. Light is the default;
set `data-theme="dark"` or `data-theme="high-contrast"` on any ancestor
element to switch.

## Build order

New components are built in dependency order, not alphabetically:

1. **Core Primitives** — `Box`, `Flex`, `Grid`, `Stack`, `Text`, `Heading`, `Portal` — done
2. **Foundation Components** — `Button`, `Input`, `Field`, `Card`
3. **Composite Components** — `Tabs`, `Dialog`, `Dropdown`, `Table`, `DatePicker`

Scaffold a new component with `pnpm generate:component <Category> <Name>`.
See the full component inventory and per-component checklist in
[docs/SPEC.md](./docs/SPEC.md).

## Component reference

Per-component docs — purpose, key props, compound parts — for everything
exported from the package: [docs/COMPONENTS.md](./docs/COMPONENTS.md).

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
  (enforced by commitlint on `commit-msg`).
- Every user-facing change needs a changeset: `pnpm changeset`.
- `pnpm lint-staged` runs ESLint + Prettier on staged files via a pre-commit hook.
