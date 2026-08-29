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
19. **Remaining Utilities & Media** — `Video`, `Audio` ✅ shipped. Scroll Area, Split Pane, Resizable, Infinite Scroll, Masonry 🔲 still backlog (unrelated to Video/Audio — see Backlog notes below)
20. **AI Core Infra** — `AIContext`/`AIProvider`/`useAI`, `useAIAction`, `AITriggerButton`, `AISuggestionPopover` ✅ shipped
21. **Flagship AI Components** — `TextArea` (`aiRewrite`), `SearchField` (`aiSearch`), `Alert` (`aiExplain`), `DataGrid` (`aiTableQuery`/`aiRowExplain`), `CommandPalette` (`aiSearch`), `EmptyState` (story only) ✅ shipped
22. **AI Enhancement Backlog** — remaining 95 components' AI opportunities (26 with a real opportunity, 69 with none — see `docs/COMPONENT_LIST.md`); all 26 shipped ✅ shipped
23. **Chat Conversation Core** — `MessageBubble`, `MessageMeta`, `CitationMarker`, `TypingIndicator`, `StreamingCursor` ✅ shipped
24. **Message Actions & Reasoning UI** — `MessageActionBar`, `FeedbackControl`, `ThinkingBlock`, `ToolTraceViewer`, `StatusLine` ✅ shipped
25. **AI Response Surfaces** — `CitationCard`, `CodeBlockToolbar`, `ChartSurface` ✅ shipped
26. **Composer Extensions** — `MentionPicker`, `SlashCommandPicker`, `PromptTemplatePicker`, `TokenCounter` ✅ shipped
27. **Conversation Shell & Memory** — `ConversationHeader`, `MemoryListItem`, `MemoryEditor` ✅ shipped
28. **Kanban Board** — phase A: `KanbanBoard`, `KanbanColumn`, `KanbanCard`, `applyKanbanCommands` ✅ shipped. Phase B: `KanbanPromptBar`, `KanbanChangePreview`, `useKanbanCommands`, `kanbanSnapshot`, `parseKanbanResolution` ✅ shipped
29. **Canvas (phase 1 — no AI)** — `Canvas`, `CanvasBlock`, `CanvasConnector`, `CanvasOutline`, `StickyNote`, `CanvasShape`, `CanvasEmbed`, `CanvasFrame`, `useCanvasViewport`, `applyCanvasCommands`, `canvasGeometry` ✅ shipped. Phase 2 (prompt pipeline + per-note `aiRewrite`): `CanvasPromptBar`, `CanvasChangePreview`, `useCanvasCommands`, `canvasSnapshot`, `parseCanvasResolution` ✅ shipped. Phase 3 (`aiCluster` affinity mapping): `canvasClusters.ts` (`clusterCommands`, `normalizeCanvasClusters`, `parseCanvasClusterResolution`, `buildCanvasClusterPrompt`) + `Canvas`'s `aiCluster`/`resolveClusters`, sharing `useCanvasCommands`' single in-flight slot and review panel ✅ shipped. Phase 4 (`aiDiagram`): `canvasDiagram.ts` (`breakDiagramCycles`, `rankDiagramNodes`, `layoutCanvasDiagram`, `diagramCommands`, `normalizeCanvasDiagram`, `parseCanvasDiagramResolution`) + `Canvas`'s `aiDiagram`/`resolveDiagram`, applied with an undo rather than staged because it is purely additive ✅ shipped. Phase 5 (the rest of the block catalogue): `code`, `table`, `link`, `checklist` and `chart` block kinds, `CanvasChecklist`, plus the viewport pass — free wheel/trackpad panning, Shift for sideways, Ctrl/Cmd to zoom, and a full keyboard set (arrows pan, `+`/`-`/`0`/`1`, PageUp/PageDown) ✅ shipped
30. **SegmentTrack** — `SegmentTrack`, a horizontal duration-scaled track of disjoint labelled regions doubling as a review queue, built from a real consumer component request (see `docs/COMPONENT_LIST.md`) ✅ shipped
31. **Canvas backdrop/controlled viewport + Panel** — `Canvas`'s `renderBackdrop` and controlled `viewport`/`defaultViewport`/`onViewportChange`, plus the new `Panel` component, closing two sanctioned-stopgap entries from a real consumer's `COMPONENT_REQUIREMENTS.md` (see `docs/COMPONENT_LIST.md`) ✅ shipped
32. **Consumer gap sweep** — five entries from a consumer app's own component-gap list, none of them new components: `RichTextEditor`'s `aiRewrite`/`buildAIPrompt`/`aiTriggerLabel` (the last text surface without an AI affordance); `Avatar`'s `color`/`colorFrom` decorative tint, with `--ds-color-status-*-subtle`/`-on-subtle` newly mapped in `variables.css` to back it; `onAIOpenChange`/`onAIAccept`/`onAIReject` on `Input`/`TextArea`/`RichTextEditor` so a call site can instrument an AI flow that otherwise arrives as an ordinary `onChange`; and a real `Breadcrumb.Item as="button"` styling bug (native button chrome was never reset, and hover/focus were keyed off `a.item`). The fifth, a suspected `Accordion.Content` staleness bug, did **not** reproduce — `Accordion.Content` renders `{children}` unconditionally with no memo or cached element, and two regression tests now record that ✅ shipped
33. **Canvas floating chat (`aiPromptFloating`)** — `CanvasChatPanel`, a draggable, minimizable (never closable) panel that decouples `CanvasPromptBar` from `Canvas`'s static top row; folds the current selection's full block data into every prompt as live context and shares `useCanvasCommands`' single in-flight slot, outcome, and `CanvasChangePreview` review panel with the static bar rather than owning a parallel pipeline. Also adds `thinking` to `CanvasResolution`/`useCanvasCommands` — the model's own brief reasoning, rendered collapsed via `ThinkingBlock` on the static bar and as a compact non-expandable two-line summary on the floating panel — so the single-turn command pipeline shows its work, not just its answer. Restyled to a reference mockup (rounded card, bare drag-handle bar, borderless prompt input, hidden-scrollbar response area, a focus-blue divider) with `CanvasPromptBar` gaining a `variant="minimal"` for it; minimizing moved to double-click plus a hover/focus-revealed icon button plus an opt-in `minimizeShortcut` chord, and the panel now shows the last user prompt (`MessageBubble`) above the reply, not just the reply. `canvasGeometry.ts` gained `frameMembers`/`withFrameMembers` — dragging or keyboard-nudging a selected frame now carries every block geometrically inside it, and a selected frame's data sent to the chat expands to include those members too, both computed live rather than stored. The selection is named chip-by-chip in the panel up to `MAX_SELECTION_CHIPS`, then collapses to one "N items selected" chip ✅ shipped
34. **Canvas snap-to-objects, focus mode, block fill** — `canvasGeometry.ts` gains `snapToObjects` (magnetic edge/centre alignment against nearby blocks, with guide lines, taking priority over grid-snap per axis) and `rectBounds` (the plain-rect generalization `boundsOf` now builds on). `Canvas` gains single-element focus mode: `F` zooms/centres and dims everything but the selected block (via `--ds-color-surface-overlay` layering, not per-block opacity — no matching opacity token exists), restricting pointer interaction to it; `L` locks focus, freezing pan/zoom/scroll while the focused block itself stays fully interactive; `Escape` exits without clearing the selection. New `CanvasFillPicker` component (`Popover` + preset swatches + `ColorPicker`), and `StickyNote`/`CanvasShape` gain `color` — an arbitrary hex fill (user content, not a token) shown via a selection-only trigger on `CanvasBlock`. `StickyNote`'s padding increased for breathing room around its text. No new `circle` block kind — the AI prompt's shape description now states that `shape:"ellipse"` with equal width/height is a circle ✅ shipped
35. **Document, DocumentPage, and the `document` block kind** — a simple multi-page note/resume editor, not a document engine: `DocumentPage` (compound `Header`/`Body`/`Footer` parts, fixed `aspectRatio` — named presets plus a custom `{width, height}`, the same "preset union + escape hatch" shape used throughout) and `Document` (a `pages` array, controlled the same way as `Canvas`'s `scene`; `RichTextEditor` per page while `editable`; standalone chrome — list/grid view, zoom — gated behind `chrome`, off for the new `document` `CanvasBlockData` kind, which embeds it bare). Auto-pagination only ever appends a page, never re-flows content backward, and is deferred via `setTimeout` rather than `requestAnimationFrame` — rAF confirmed live to never fire at all in a backgrounded/unpainted tab, a real failure mode, not just a test-environment one. Double-clicking a `document` block opens its editor and enters `Canvas`'s own focus mode locked by default, the one place in this library where focus doesn't default to free-to-look-around ✅ shipped
36. **Node graph** — a new standalone family (not a `Canvas` block kind, so it and its data can be referenced from any module): `Node` (a positioned, nameable box with an input/output port), `NodeConnector` (pure-geometry SVG edge), `NodeGroup` (a data-membership group's drawn boundary, not `CanvasFrame`'s geometric containment), and `NodeGraph` (the controlled/uncontrolled orchestrator — `NodeGraphData` the same "consumer owns the data" shape as `Canvas`'s `scene`). `nodeGraph.ts` adds `computeNodeOutput`, deriving a connected node's effective output — its own `data` plus every upstream node's, keyed by node id rather than assuming a spreadable object shape — on every read from any module, and `canConnect`/`wouldCreateCycle`, checked before a connection is made so that recursion never has to guard against a cycle in practice. Connecting is click-driven (arm an output port, click a target's input port), not drag-driven, so it stays keyboard-reachable; repositioning stays pointer-drag-only with arrow keys as its keyboard equivalent, the same split `Canvas` draws. Also: `StickyNote` loses its box-shadow, border, and border-radius (the tone accent edge is unchanged) ✅ shipped
37. **Second consumer gap sweep** — four asks from a UX-forté-building consumer app's own gap log, none of them new components: `CanvasShape` gains `editing`/`onTextChange`/`onEditingEnd` (double-click to edit its label, the same as `StickyNote`), and `Canvas`'s `aiRewrite` now wires a "Rewrite with AI" trigger through for `shape` blocks too — rendered at the `CanvasBlock` level rather than inside `CanvasShape`, since a trigger drawn inside a clipped shape (`diamond`/`triangle`/`parallelogram`) would clip away with it; every other block kind still has no click-to-edit entry point at all, so `aiRewrite`'s doc comment now says so explicitly instead of silently no-op-ing. `AISuggestionPopover` gains an opt-in `editablePrompt`/`onSubmit` pair that swaps the default "fetch on open" for an editable textarea pre-filled from the built prompt, so the person using the app — not just the integrating developer — can steer the instruction before it's sent; `StickyNote` adopts it behind a new `aiRewriteEditable` flag, off by default. `Sidebar.Item` gains an `actions` slot, rendered as a sibling of the item's own link/button within the same `<li>` rather than nested inside it (which is invalid HTML and breaks the item's own click handling) — the same guard `KanbanCard`'s `actions` slot already uses. The internal AI-generation fallback prompt (`buildCanvasPrompt`) now illustrates `"op":"create"` with two different block kinds instead of one, since a single `kind:"sticky"` example was anchoring every generated block to that kind regardless of content, even when a different shape would read better in a flowchart. A fifth ask (icon coverage for research/design-tool categories) lives in `@mellon-design/icons`, a different package — not actionable here ✅ shipped
38. **`CanvasChatPanel` history, resize, and consumer context** — three asks about the floating AI chat. It now keeps the full exchange rather than the single most recent turn: every `lastMessage` that changes to a new value is appended to a scrollable history alongside the prompt that led to it, tracked by comparing against the last-appended value rather than a busy-status transition, so a consumer that already has a reply in hand on mount (not just one reached via a live `submit`) still shows it immediately. Fixed along the way: the "Thinking" summary's `TypingIndicator` dots used to be tied to `thinking` text being present, not to actual busy status, so they kept animating forever once a reply had already landed — the busy indicator is now a separate element shown only while `status` is `'loading'`/`'streaming'`, gone the instant it settles. The panel is now resizable — drag the corner handle, or Alt+Arrow (Shift for a bigger step) while any focusable part of the panel has focus, mirroring `Canvas`'s own Alt+arrows-resize-a-block convention — clamped to `boundsRef` the same way dragging already was. `CanvasChatPanel` gains `context` (folded into every prompt via `buildCanvasChatPrompt`, alongside the selection; a plain string rides verbatim, anything else JSON-serializes), and `Canvas` gains a `chatContext` pass-through prop so a host app can hand the floating chat anything it wants the model to see — its own app state, the signed-in user, a page's metadata — without the library needing to know what that is ✅ shipped
39. **Third consumer gap sweep** — three more fixes from the same gap log. `Sidebar.Item as="button"` centered its label text — `<button>` carries a browser-default `text-align: center` the item's own CSS never reset, unlike its `a`/`div` targets — `.item` now sets `text-align: left` explicitly. `MessageBubble`'s `user` variant reused `Card`'s `--ds-radius-lg` for its bubble box, which rounds a short one-line message's corners into each other and reads as a pill/button rather than a chat bubble; `.bubble.bubble` now sets its own smaller `border-radius: var(--ds-radius-md)` instead of inheriting `Card`'s. The internal AI-generation fallback prompt's `"Block kinds:"` line never mentioned the `document` kind (shipped in phase 35) or its `update` patch shape, so the model had no way to know writing into a `document` block's `pages` was legal — `buildCanvasPrompt` now lists it alongside the other kinds. A fourth item (a focus/distraction-free viewport for a canvas-embedded `document` block) turned out to already be covered by phase 35's own focus-mode-on-double-click behaviour — no library change needed, just discoverability on the consumer's side ✅ shipped
40. **Node pill restyle + `Canvas` `node` block kind + `CanvasToolbar`** — a real consumer request to rebuild the node/arrow visuals from a reference diagram (colored pill-shaped nodes, small dot ports, curved arrows) and make nodes placeable directly on `Canvas`. `Node` gains `color` (the same free-fill escape hatch as `StickyNote`/`CanvasShape`, dropping the default border/shadow for a flat chip) and `fill` (fills an already-positioned wrapper instead of self-positioning via `style.left`/`style.top`); its border-radius is now `--ds-radius-full` by default, its body only renders when it actually holds `children` (a bare label chip stays a single row, with a divider only where a body exists, via `:has()`), and its rename input now stops keyup propagation — previously a latent bug where `NodeGraph`'s own arrow-nudge/Delete keys could fire while typing a rename. `NodeConnector` and `CanvasConnector` both move their default stroke from `--ds-border-width-medium` to `-thin`, matching the reference's lighter line weight. A new `CanvasNodeBlock` (`kind: 'node'`, `name`/`color`/`hasInput`/`hasOutput`) reuses `Node` itself (`fill` mode) as its face — not a second implementation — but connects through `Canvas`'s own `CanvasConnector`/command reducer, not `NodeConnector`: `Canvas` gains click-to-connect state (arm an output port, click a target's input port, Escape cancels ahead of focus-mode/selection unwinding) via `handleNodeOutputPortClick`/`handleNodeInputPortClick`, both funnelled through the same `run()` every other mutation uses. This deliberately does **not** touch `NodeGraphData`/`computeNodeOutput` — those stay the standalone family's own data-flow API from phase 36; only the presentational half (the pill face and its ports) is shared. New `CanvasToolbar` (`shapeToolbar` prop) adds a small floating bar — sticky note, rectangle, pill, diamond, node, frame — that creates a block via `run([{ op: 'create', block }])` at the current viewport centre, cascading its placement a little further on each repeated click; it's the first `Canvas` affordance needing no `AIProvider` or resolver, since it never calls a model. **Found only by testing in a real browser, invisible to jsdom**: `CanvasToolbar`'s own root needs the same `onPointerDown={(event) => event.stopPropagation()}` guard `CanvasChatPanel` already carries — without it, a click bubbles to `onSurfacePointerDown`, which unconditionally takes pointer capture on the surface to arm a marquee-select, and a captured pointer never delivers its `click` to the button underneath it. jsdom no-ops `setPointerCapture`, so every toolbar-insertion test passed while every button was silently broken in a real browser — the same class of gap this doc already flags for pointer-drag physics generally. Fan-in/fan-out was already unrestricted at the reducer level for both the `node` block kind and the standalone `NodeGraph` (`applyCanvasCommands`'s `connect` case and `canConnect` only reject a duplicate connector id, a self-connection, an unknown endpoint, or a cycle — never a second edge into the same port) but had no explicit regression test on the `Canvas` side; added ✅ shipped
41. **`CanvasBlock.chrome` override for `document` blocks** — a real-consumer-request addition closing a gap `Document`'s own doc comment already named ("a `Canvas` block, currently the only one — with `chrome={false}`", no override existed). `CanvasBlockOwnProps` gains `chrome?: boolean`, threaded straight to `Document.chrome` for the `document` case, defaulting to the prior hardcoded `false` so nothing changes unless a consumer sets it. Scoped to `CanvasBlockOwnProps` rather than `CanvasOwnProps`, since `CanvasBlock` is already independently exported and usable outside `Canvas`'s own render loop — a host wanting one specific document-kind block to drop into `Document`'s standalone, self-contained viewer (its own list/grid/zoom, independent of anything driving `Canvas`'s pan/zoom) renders that one `CanvasBlock` with `chrome` set, rather than needing a scene-wide or `Canvas`-level toggle ✅ shipped
42. **`Sidebar.Item as="button"` native chrome** — the other half of Phase 39's `text-align` fix, found by the same consumer via visual inspection. `.item` reset `text-align`/`text-decoration`/`cursor` for the `as="button"` case but never `background`/`border`/`appearance`, so a native `<button>`'s browser chrome (gray background, beveled border, platform font) still leaked through on top of `.item`'s own styling — harmless for the default `as="a"`/`as="div"` targets, which have no such chrome to begin with. `.item` now also sets `background: none; border: none; appearance: none; font: inherit` — all four are no-ops for `<a>`/`<div>`, same "safe unconditionally" shape as the `text-align` fix. `font: inherit` is placed before the existing `font-family`/`font-size` declarations in the same rule so those explicit values still win; it only resets the sub-properties (weight, line-height, style) neither one sets ✅ shipped

43. **Node-like canvas blocks — fixed size, ports, highlight selection** — a real consumer request from the same node-diagram reference that drove phase 40, closing the gap it left: only `kind: 'node'` could be wired into a diagram, and every block kind (nodes included) still carried an eight-point resize frame. `CanvasBlock` now exports `isNodeLikeBlockKind`/`NODE_LIKE_BLOCK_KINDS` covering `node`, `sticky` and `shape`, and three behaviours hang together on that one predicate rather than being three independent checks. **(1) They are never resizable** — no handles regardless of the `resizable` prop, and `Canvas`'s Alt+arrows path announces "<block> can't be resized." instead of silently doing nothing, since a key that appears not to have registered is worse than a stated refusal; their size is their content's, the way a pill's is, and every other kind keeps both the handles and Alt+arrows. **(2) They are connectable** — `sticky` and `shape` now draw the same input/output port dots `Node` does, styled by importing `Node.module.css`'s own `.port` rules rather than restyling (so the three cannot drift apart visually), and `Canvas` widens its existing `handleNodeOutputPortClick`/`handleNodeInputPortClick` wiring from `kind === 'node'` to the predicate. Nothing in the data layer needed to change: `applyCanvasCommands`' `connect` and `canvasGeometry`'s routing were already block-kind-agnostic, so the port dots were the _only_ thing that was ever node-specific about connecting. The ports are drawn at the `CanvasBlock` level, not inside `StickyNote`/`CanvasShape` — the same reason the `shape` AI trigger is: a port sits half outside the face's own box, and `diamond`/`triangle`/`parallelogram` clip anything drawn inside them. They render only when `onInputPortClick`/`onOutputPortClick` are supplied, so a `readOnly` canvas shows no dots at all; `node` keeps drawing inert ports either way, since there the dots also state the graph's shape. **(3) Selection is a rounded highlight** (`data-node-like` on the wrapper, a thicker outline standing off at `--ds-space-xs` with `--ds-radius-lg`) rather than the tight rectangular frame the sized kinds carry — a frame with corner points that resize nothing is a lie about what the block does, and a hairline rectangle around a rounded pill reads as the top edge of a resize box that isn't there. Test-suite consequence worth knowing: sticky/shape blocks now contribute two `<button>`s each, so `getAllByRole('button')` and loose `getByRole('button', { name: /…/ })` queries in `Canvas.test.tsx` had to be scoped to the outline `<nav>` — the port labels embed the block's own `canvasBlockLabel`, which is exactly what a loose name regex matches ✅ shipped

44. **`Document` pagination + grid name tag + host-supplied `@` references** — two confirmed bugs and one API gap, all reported by the UX-forté consumer app building against the published `0.10.0`. **(1) `Document` clipped overflowing content instead of flowing it.** `checkOverflow` had exactly one caller — the per-page keystroke handler — so content set programmatically (a `pages` prop, a host's `onPagesChange`, an AI writing a long body in one shot) never triggered the check at all and everything past the first page's height was silently clipped, `DocumentPage.Body` being `overflow: hidden` with no scrollbar to hint at it. Worse, when typing _did_ trigger it, the check appended an **empty** page and left the overflow clipped in the page above. Now an effect on `pages` measures each mounted page's top-level blocks and moves the ones that don't fit onto the following page, appending one when needed — running regardless of `editable`, since invisible content is invisible either way. The policy is a pure function (`src/utilities/documentPagination.ts`, `paginationSplitIndex`), measurements-in/index-out, for the same reason `canvasGeometry.ts` never measures the DOM: jsdom has no layout engine, so anything reading `getBoundingClientRect` is untestable there. Two documented limits stay: flow is **forward-only** (deleting a paragraph never pulls the next page's content back), and splits happen **between** top-level blocks, never inside one — a single block taller than a page stays put and clips, because moving it would push the same block along forever without ever fitting, which is also what makes the effect terminate. When the break lands under the caret, focus and the caret follow the moved content; a split from a `pages` update moves nobody's focus. Verified in a real browser: 24 paragraphs handed over as one non-editable `pages` entry paginate to 5 pages with zero overflowing blocks and no content gaps. **(2) Grid view knocked page 1 off the row's baseline whenever `name` was set** — the name tag was attached per-page via `renderPageWithName(html, index, index === 0)`, and its `.namedPage` column wrapper made page 1's grid cell taller than every sibling by the tag's own height. List view is correct as-is (the tag reads as a label on the column below it), so grid now renders the tag as a full-width `.gridNameRow` above the pages instead — one tag for the document, belonging to all of them. **(3) `references`/`referenceLabel` on `CanvasPromptBar`/`CanvasChatPanel`/`Canvas`** — `blocks` was the only thing populating the `@` menu, so a consumer whose unit of work is a _page_ had to synthesize fake `kind:'node'` blocks and strip them back out of the `Referenced blocks:` line before the prompt reached the model; leaving them in tells the model a block with that id is on the canvas, and every command it then aims there comes back rejected by `applyCanvasCommands`. Host-owned references now merge into the same picker but go out under their own heading. `buildCanvasPromptWithMentions` gained them as optional third/fourth arguments rather than a changed signature, so existing two-argument calls emit byte-identical text. **(4) A follow-up from the same consumer: `CanvasPromptBar`'s `minimal` variant could not be made taller than one line of text.** `.input.inputMinimal[data-size] { padding: 0 }` is specificity (0,3,0), which no plain consumer class selector can outrank — `.my-bar input` is (0,1,1) — so the only escape was `!important`, and the variant built _for_ a chat composer was the single variant that couldn't stand taller than a toolbar input (measured at 17.78px, computed padding `0px`). `minimal` now zeroes only the **inline** padding, which is all "flush with the host's own edge" ever needed; block padding comes from a new `size` prop forwarded to `Input` (`promptSize` on `CanvasChatPanel`, since that component's own `size` would read as the panel's draggable dimensions). Note the (0,3,0) specificity is still required to beat `Input`'s own `[data-size]` padding rule — the fix is exposing the knob as a prop, not lowering the selector, which would just reintroduce CLAUDE.md's cross-component CSS hazard #2. Browser-verified: the floating composer goes 17.78px → 40px with `8px 0` padding, and the `default` variant is untouched at `8px 16px`. Also documented, at the consumer's suggestion, that `Document`'s `pages` strings are **HTML, not markdown** — models write `**bold**` into them and it renders as literal asterisks ✅ shipped

45. **`Document` sheet geometry — a real page, real-length zoom, real prose rhythm** — a real consumer report that the document editor "is very bad": text that didn't change size on zoom, content clipping at the bottom of a sheet, too much header space, and the whole thing reading "like I'm writing inside a card". Four distinct causes, all in the page's geometry. **(1) The page was a card.** `.page` was `24rem` wide with `--ds-font-size-sm` body text; it is now A4's own width (`49.625rem` — 210mm at 96dpi) with a 1in print margin and `--ds-font-size-md` text. Paper dimensions are component-intrinsic geometry with no matching token and no business having one. **(2) Zoom was a `transform: scale()`, which was wrong three ways at once.** A transform takes no part in layout, so zooming in never grew the scroll area and the sides and bottom of the page went somewhere with no scrollbar to reach them — this is the reported bottom-clipping. The `align-items: center` under it made start-edge overflow unreachable even in principle (pages centre with `margin-inline: auto` now). And auto-pagination compares `getBoundingClientRect()` (scaled by the transform) against a padding read from `getComputedStyle` (**not** scaled), so above 100% the clip limit was wrong by the padding times the zoom factor and pages split in the wrong place — a second, quieter clipping bug that only appeared once someone zoomed. Zoom is now one custom property, `--doc-sheet-scale`, multiplying sheet width, print margin, and body text size **together**: real lengths, so layout reflows, the viewport scrolls to the whole page, and pagination keeps measuring in one coordinate space. Scaling all three together is also what keeps the same amount of text on a page at every zoom level — scaling only the sheet, or only the text, would repaginate the document every time someone zoomed. `DocumentPage` exposes the two variables the scale lands on (`--doc-page-margin`, `--doc-page-font-size`), defaulted to `--ds-*` tokens so a standalone `DocumentPage` is unaffected; grid view drives the same scale to `0.32` (a thumbnail is a small page, not a cropped one — it used to shrink the sheet and leave full-size text in it), and a `chrome={false}` embedded page reads both from container-query units so it stays in proportion inside whatever box its `Canvas` block gave it, floored via `clamp()` so a small block stays legible rather than faithfully proportional. **(3) The page had no prose typography of its own.** `reset.css`'s `* { margin: 0 }` flattens paragraph and heading spacing, and `reset.css` isn't part of `dist` at all — so this could never be inherited from anywhere and a consumer shipping their own reset would get a different document again. `Document` now states the scale itself, entirely in `em` so it rides `--doc-sheet-scale`, and zeroes the first/last block's outer margins: those land _inside_ the page's print margin rather than collapsing through it, and otherwise open every sheet with a blank line. **(4) Two rows of chrome, and a header a full margin from its own body.** The format toolbar and the view/zoom controls now share one row; `DocumentPage`'s `.header + .body` seam is a paragraph gap rather than two stacked print margins, which is the reported "header space is too much". Also: the zoom control shows its percentage and that readout is the reset-to-100% button (a silent transform gave no way to tell 110% from 120%, nor any way back), and `.editor [contenteditable]` now stretches to fill the page body — `RichTextEditor` puts `className` on its **root**, not its editable surface, whose own `min-height` is a fixed `8em`, so the caret area stopped a fixed distance down a sheet of any height and clicking the blank rest of it did nothing. No prop was added, removed, or changed. Every one of these is invisible to jsdom (no layout engine, no `getComputedStyle` lengths, no scroll geometry); all of it was verified in a real browser — 100%→200% zoom scrolls to the full sheet with both gutters intact, 40 paragraphs paginate to 3 pages with zero blocks past any page's clip limit ✅ shipped

Phase 28 is the library's first AI affordance that **changes structured
state** rather than producing text. It was built in two halves on purpose.
Phase A is the board with no AI at all: every AI affordance here is inert
without an `AIProvider`, so a prompt bar can never be a board's
accessibility story, and the board had to stand alone first.

Phase B adds the command pipeline. The vocabulary (`KanbanCommand`) and its
validator belong to the library; the transport does not — `resolveCommands`
is consumer-owned, the same split as `FileUpload`/`DataGrid`, and
`AIClient` in `src/contexts/AIContext.ts` was deliberately **not** widened,
since 26 AI-enhanced components depend on that two-method contract. Without
a resolver the board falls back to `complete()` plus
`parseKanbanResolution`, so any existing client works.

Responses are classified by blast radius rather than handled uniformly: no
commands is an answer (highlight, mutate nothing), one non-destructive
command applies with an undo `Toast`, and anything larger or any `delete`
stages a reviewable diff. Validation runs on every path including the
consumer's own resolver, because a model that hallucinated an id is not
more trustworthy for having come through someone else's transport.
Unparseable prose is treated as an answer, not an error — a model replying
to "what's blocked?" in plain English has done the right thing.

Phase 29 reopens the Canvas/Workspace exclusion recorded below. That
exclusion's reasoning — "a full canvas engine" — is right for a `<canvas>`
implementation and wrong for a DOM one, where blocks are ordinary
absolutely-positioned elements under a single transform. Doing it this way
keeps component reuse, design tokens, all three themes and the
accessibility tree, none of which survive a raster surface. **Freehand ink
remains excluded** and is the one item the original reasoning got right.

The canvas reuses phase 28's shape wholesale: a pure `applyCanvasCommands`
reducer behind every input path, drop-and-report validation so a model can
drive it safely later, and an accessible linear twin (`CanvasOutline`)
standing in for spatial content exactly as a chart's table twin stands in
for its SVG. Phases 2–5 add the prompt pipeline, `aiCluster` affinity
mapping, `aiDiagram`, and the remaining block catalogue.

Phase 3's one generalizable decision: **the model is asked what belongs
together, never where to put it.** Grouping is the part a language model is
genuinely good at; coordinates are the part it is worst at, and a grouping of
thirty notes returned with positions comes back overlapping or stacked. So
the response carries titles and member ids only, and `clusterCommands` — pure,
deterministic, unit-testable without a layout engine — decides the geometry.
It is the same move `@`-mention resolution makes on the prompt bar, one level
up.

Phase 4 applies the same split to diagrams — the model returns a graph, the
library ranks and lays it out — and settles where the blast-radius line
actually falls. Clustering always stages because it rearranges the user's own
arrangement; a generated diagram applies with an undo because it adds content
and touches none, which is checked (`isPurelyAdditive`) rather than assumed.
Command count was never the right axis.

Phase 5 completes the catalogue and fixes navigation. Three things worth
keeping: the painted grid is gone and the surface is the recessed neutral
(`surface-secondary`) with every block face on `surface-primary`, so blocks
read as sitting _on_ the workspace; the wheel listener is bound natively
because React registers wheel handlers as passive, where `preventDefault`
silently does nothing and the page scrolls away underneath the gesture; and a
press on a control inside a block must not take pointer capture, because a
captured pointer never delivers its click — which is how a checklist's boxes
stopped ticking the moment the catalogue gained an interactive face.

Two Phase 1 defects surfaced once generated content started living inside
frames, both fixed here: the connector layer painted under every block, so a
frame covered every edge inside it (connectors now paint above frames and below
other blocks), and a filled frame used `surface-secondary` — the same fill a
clipped `CanvasShape` uses — so a diamond on a frame was invisible (a frame is
now an unfilled boundary: dashed edge plus title).

**2 phases remain, both backlog: 18 and 19** (see "Backlog: Phase 18 and 19" below). Phases 20-22 (AI integration) are an unrelated feature track that jumped ahead of 18-19 in build order — numbered to continue the existing sequence rather than interleave, with no dependency on Mobile Gestures/Remaining Utilities either direction. Phases 23-27 (AI Chat Components) are a third, later track building on Phase 20's infra (`useAIAction`'s status vocabulary, `AISuggestionPopover`'s composition patterns) but not on 18/19/21/22 — the entire track is now shipped, see "Shipped Phase Notes" below for the per-phase write-ups.

Phase 30 is a single-component addition prompted by a real consuming app's
component request (`docs/COMPONENT_LIST.md`'s entry records the request
verbatim), not part of the dependency-ordered roadmap above — same
"jumped ahead, numbered to continue the sequence" precedent as 20-22 and
23-27, with no dependency on 18/19 either direction. `SegmentTrack` is a
fully-controlled duration-scaled track: N independently-labelled, disjoint
regions (`state: candidate | excluded | selected | accepted | rejected`)
positioned by `start/duration`, reusing `Slider`'s `clamp`, `Video`'s
`formatTime`, and the click-to-seek-via-`usePointerDrag` shape `Audio`'s
waveform track already established — right down to isolating a segment's
own `onPointerDown` so pressing a region doesn't also fire the track's
seek handler for the same gesture (`Audio`'s `isolate()` precedent).
Arrow-key navigation moves left-to-right by `start` via `useRovingFocus`,
the same one-dimensional fit `ButtonGroup`/`Select` already use. The two
status states (`accepted`/`rejected`) get a small `AlertVariantIcon`
badge — deliberately floated _above_ the segment on the track's own
neutral surface rather than inside the filled mark, the same "-on"
contrast-role gap `ChartDataLabel` already works around by keeping labels
outside their marks; the Foundation ships no guaranteed-readable
icon-on-status-fill color yet. Considered and rejected: `Timeline` (an
event log, not a duration-proportional axis) and a `RangeSlider`
composition (one draggable min/max pair, not N independent regions with
per-region review state). Drag-to-resize a segment's boundaries was
explicitly scoped out by the request as a possible v2, not built here.

A follow-up request added `trimmable` — one continuous, draggable range
independent of `segments`, reusing `Audio`'s own cross-clamped "Trim
start"/"Trim end" handle shape and keyboard nudging verbatim. It is
reporting-only (`onTrimChange`): unlike `Audio`, this component owns no
media element, so it cannot itself constrain playback the way `Audio`'s
`trimmable` + `playTrimmedOnly` pair does — "playback constrained to the
selection" is the caller's job, demonstrated in the `Trimmable` story by
pairing the reported `trimRange` with a plain `<audio>` element's
`onTimeUpdate`. The one structural change this required: `role="listbox"`
now wraps only the segment `option` buttons in their own layer, not the
whole track — the trim handles are `role="slider"`, and a `listbox`'s
ARIA-required-children rule rejects any non-`option` sibling, which axe
caught immediately once both affordances rendered together.

Phase 31, like 30, is a real-consumer-request addition outside the
dependency-ordered roadmap — this time two entries from a PDF editor's own
`COMPONENT_REQUIREMENTS.md` log (verbatim in `docs/COMPONENT_LIST.md`),
both previously marked "non-blocking" because a sanctioned composition
already covered them. Promoting a documented workaround to first-class
support doesn't require the workaround to be broken — it requires deciding
the pattern is common enough to own.

`Canvas` gained `renderBackdrop` and a controlled `viewport` triple. The
consumer's stopgap had been `useCanvasViewport()` plus a hand-transformed
wrapper `<div>`, reaching past `Canvas`'s black-box boundary to keep a
`pdf.js` bitmap pixel-locked to the scene. Both additions close that gap
without opening the block-kind union: `renderBackdrop` is a render prop,
not a `CanvasBlockData.kind`, because a raster backdrop has no id, no
selection state, and no reason to go through `applyCanvasCommands` — it
is exactly the kind of thing the "one transform carries the viewport"
architecture already generalizes to for free, once the transform itself
can be read from outside. It renders inside `.world`, ahead of every
block, so it inherits pan/zoom automatically and needs no coordinate math
of its own; it is `aria-hidden`, on the same reasoning that keeps the
connector SVG hidden — a raster page carries no text, and any actually
readable content over it is its own `CanvasBlock`, which stays in the
tree as usual. The controlled `viewport`/`defaultViewport`/
`onViewportChange` triple threads straight through to
`useCanvasViewport`, which now accepts the identical pair — the same
controlled/uncontrolled contract `scene`/`selectedIds` already use, so a
consumer state-managing its own `pdf.js` canvas can read and drive the
same pan/zoom `Canvas` renders with, rather than maintaining a shadow copy.
Internally this meant swapping the hook's raw `useState` for
`useControllableState` and its functional (`(previous) => next`) updates
for reads off the hook's own `viewport` closure — safe here because, as
elsewhere in this library (`scene`, `selectedIds`), nothing calls the
setter more than once per synchronous handler.

`Panel` is new: a persistent, non-modal container meant to dock at a
viewport edge and fill its height — the property-panel pattern (select a
block, see its font/size/color, keep the panel open while clicking
around the canvas beside it). The consumer's stopgap was `Box` + `Card`
composed by hand, because neither existing candidate fit: `Sidebar`
types its `children` as `Sidebar.Item`/`Sidebar.Group`, a nav list, not
arbitrary panel content; `Drawer` renders through a `Portal`, traps
focus, and closes on backdrop click, which is the right shape for a
transient overlay and the wrong one for a panel meant to coexist with a
surface the user keeps interacting with. `Panel` reuses `Sidebar`'s
default (non-drawer, always-in-flow) contract with `Card`'s simplicity —
a `dock` prop (`start` | `end`) picks which edge loses its border, and
`header`/`footer` slots pin rows above and below a scrollable body.
Deliberately **not** built on `Dialog.Header`/`.Body`/`.Footer` despite
the "share parts across trees" precedent (`Drawer.Header` _is_
`Dialog.Header`): `Dialog`'s header reserves `padding-right` for its
absolute-positioned close button, which a docked, non-modal panel has no
reason to carry, so reusing it would import unwanted spacing rather than
save real duplication.

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

### Phase 19 (partial): Video, Audio — shipped

`Video` wraps a plain `<video>` with fully custom controls — the native
`controls` attribute can't be themed with `--ds-*` tokens — reusing
`Slider` directly for both seek and volume (the "thin wrapper" precedent)
rather than hand-rolling a second thumb. Play/pause, mute, an optional
captions (CC) toggle (only rendered when `captions` tracks are passed),
and fullscreen (feature-detected — `requestFullscreen` doesn't exist in
jsdom) round it out. All media-element state (`currentTime`, `duration`,
`volume`, `muted`, `paused`) is read back off the element's own DOM events
rather than tracked independently, so a browser-level gesture (a
media-key press, an OS volume change) can't desync the UI. Loading a
**local file** is deliberately not this component's job — that's
`FileUpload`; a consumer wires `onFilesAdded` to an object URL and hands
it to `Video`'s `src`.

`Audio` covers the "Audio" backlog item and adds a real rendered
waveform, since a trim UI without one isn't the shape anyone asked for.
`computePeaks` (pure, unit-tested) downsamples decoded PCM channel data to
per-bucket max-amplitude values; the actual decode
(`AudioContext.decodeAudioData`, browser-only, feature-detected the same
way `Video`'s fullscreen is) lives in `decodeAudioPeaks`, which resolves
`null` on any failure — unreachable `src`, unsupported codec, CORS, no
`AudioContext` at all — and the waveform falls back to flat placeholder
bars rather than inventing data, the same refusal `LineChart` already
applies to a missing reading. The waveform track carries up to three
independent `role="slider"` thumbs sharing one pointer-math helper
(`timeFromClientX`): a "Seek" thumb (always present, doubling as the
playhead) and, when `trimmable`, "Trim start"/"Trim end" thumbs using
`RangeSlider`'s cross-clamped closer-thumb-wins shape. Each thumb owns its
own `usePointerDrag` instance and isolates its own `onPointerDown` (a
small `isolate()` wrapper) so grabbing a thumb doesn't also fire the
track's own click-to-seek handler for the same gesture. **Trim state is
reporting-only** — `onTrimChange` fires with `{ start, end }` seconds;
no audio is re-encoded in this library, the same boundary `AIClient`
draws around completions. `playTrimmedOnly` constrains playback to the
trimmed window without touching the underlying file.

### Backlog: Phase 18 and the rest of Phase 19 (not started)

Phases 1-17, 19 (Video/Audio), and 20-22 above are ✅ shipped. Phase 18 and
the rest of Phase 19 are 🔲 **backlog** — the remaining dependency-ordered
roadmap for the rest of the Component Inventory, written down so a future
session can pick either up without re-deriving the ordering. Neither
depends on the other, on Video/Audio, or on Phase 22.

18. **Mobile Gestures** (backlog) — Pull To Refresh, Swipe Actions.
    Deferred to its own session; needs real-browser touch-simulation
    verification via `pnpm test:storybook`, not Vitest/jsdom.
19. **Remaining Utilities** (backlog) — Scroll Area, Split Pane, Resizable
    (all reuse `usePointerDrag`), Infinite Scroll (needs a new
    `useIntersectionObserver` hook), Masonry. `Video`/`Audio` are done —
    see above.

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

Media: Image, Figure, Carousel, Video, Audio, SegmentTrack.

Node: Node, NodeConnector, NodeGroup, NodeGraph (Phase 36, shipped; pill
restyle plus `Canvas` reuse in Phase 40).

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
