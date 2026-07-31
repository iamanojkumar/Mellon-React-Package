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

Rather than waiting for the Foundation to be completed, this library is
built now using placeholder design tokens via CSS variables. This allows
component APIs, accessibility, composition patterns, testing, documentation,
and developer experience to be completed before the token package is
integrated.

When the Foundation is ready, integrating the generated token package
should require only updating the styling layer — not refactoring component
logic.

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

Never hardcode design values. Use placeholder CSS variables that mirror the
future Foundation token names, with a fallback value:

```css
background: var(--ds-color-surface-primary, #ffffff);
color: var(--ds-color-text-primary, #111111);
padding: var(--ds-space-md, 1rem);
border-radius: var(--ds-radius-md, 0.5rem);
```

Fallbacks are temporary scaffolding and should be removed once
`@company/tokens-web` is integrated. Motion values follow the same rule —
never hardcode a duration or easing curve:

```css
transition:
  var(--ds-motion-duration-medium) var(--ds-motion-easing-standard);
```

## Component Design Principles

Components must be composable, accessible, strongly typed, performant,
minimal, reusable, themeable, responsive, and SSR compatible. They must
support controlled and uncontrolled usage, ref forwarding, polymorphic
rendering where appropriate, keyboard navigation, RTL, and dark mode.
Favor composition over large prop APIs.

## Build Order

Build in **dependency order, not alphabetical order**:

1. **Core Primitives** — `Box`, `Flex`, `Grid`, `Stack`, `Text`, `Heading`, `Portal`
2. **Foundation Components** — `Button`, `Input`, `Field`, `Card`
3. **Composite Components** — `Tabs`, `Dialog`, `Dropdown`, `Table`, `DatePicker`

Later components compose earlier ones. `Box` ships first (see
`src/components/Box`) because every layout primitive and most foundation
components render through it.

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

Every component ships unit tests, interaction tests, accessibility tests,
and keyboard tests, plus stories for: Default, Variants, Disabled,
Loading, Error, Dark Mode, RTL, Responsive, Accessibility, Controlled,
Uncontrolled.

## Future Token Integration

`@company/tokens-web` will eventually export generated CSS variables and
token exports. Component logic must remain completely independent of the
token implementation — components only ever reference `--ds-*` variable
names, never token values directly. Migration is: publish the real
`@company/tokens-web` package, replace `src/styles/variables.css` with its
output (or import from it), delete the inline fallback values. No
component `.tsx`/`.module.css` files should need to change.
