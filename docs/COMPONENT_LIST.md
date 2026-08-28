# Component List

All shipped components in `src/components/`, grouped as in `docs/SPEC.md`'s
Component Inventory. Each is a folder under `src/components/<Name>/` with its
own `.tsx`, `.module.css`, `.test.tsx`, `.stories.tsx`, and `index.ts`.

## Foundations

- Box
- Flex
- Grid
- Stack
- Inline
- Spacer
- Container
- Center
- Divider
- AspectRatio
- VisuallyHidden

## Typography

- Text
- Heading
- Display
- Label
- Paragraph
- Caption
- Code
- Link
- Blockquote
- List
- ListItem

## Buttons

- Button
- IconButton
- ButtonGroup
- ToggleButton
- SplitButton
- FloatingActionButton

## Inputs

- Input
- TextArea
- PasswordField
- SearchField
- NumberField
- EmailField
- PhoneField
- OTPInput
- PinInput
- Select
- MultiSelect
- Combobox
- Autocomplete
- Checkbox
- RadioGroup
- Switch
- Slider
- RangeSlider
- Rating
- ColorPicker
- DatePicker (covers Date Range Picker via `selectionMode="range"`)
- TimePicker
- FileUpload

## Form

- Field
- Fieldset
- HelperText
- ErrorMessage
- FormGroup
- FormSection

## Navigation

- Navbar
- Sidebar
- Breadcrumb
- Tabs
- Pagination
- Menu
- Dropdown
- ContextMenu
- CommandPalette
- NavigationRail
- TreeView

## Data Display

- Avatar
- AvatarGroup
- Badge
- Chip
- Tag
- Card
- Table
- DataGrid
- Accordion
- Timeline
- Calendar
- Statistic
- EmptyState
- KeyValueList

## Board

- KanbanBoard
- KanbanColumn
- KanbanCard
- KanbanPromptBar
- KanbanChangePreview

## Canvas

- Canvas
- CanvasBlock
- CanvasConnector
- CanvasOutline
- StickyNote
- CanvasShape
- CanvasEmbed
- CanvasFrame
- CanvasChecklist
- CanvasPromptBar
- CanvasChangePreview
- CanvasChatPanel
- CanvasFillPicker
- Document
- DocumentPage

## Feedback

- Alert
- Banner
- Toast (covers Snackbar via `ToastProvider`/`useToast`)
- Progress
- CircularProgress
- Skeleton
- Spinner
- LoadingOverlay

## Overlays

- Dialog (covers Modal via `size` prop + `Header`/`Body`/`Footer` parts)
- Drawer (covers Bottom Sheet and Sheet via `placement` prop)
- Popover
- Tooltip
- HoverCard

## Media

- Image
- Figure
- Carousel

## Utilities

- Portal
- FocusTrap

## Mobile

- BottomNavigation

---

**Shipped so far:** 91 components (Phases 1-14, per `docs/SPEC.md`).

**Not yet built** (Phase 18 roadmap, see `docs/SPEC.md`):

- Mobile: Pull To Refresh, Swipe Actions (Action Sheet is covered by `Drawer`)
- Utilities: Scroll Area, Infinite Scroll, Split Pane, Resizable, Masonry

**Media: `Video`, `Audio`** — shipped (Phase 19, see `docs/SPEC.md`).
`Audio` covers the trim-editing use case with real waveform rendering
(`computePeaks`/`decodeAudioPeaks`) plus draggable trim handles; it
reports `{ start, end }` only and never re-encodes audio itself.

**Media: `SegmentTrack`** — shipped (Phase 30, see `docs/SPEC.md`), added
from a real consumer request (a same-speaker-detection review queue: a
duration-scaled track of the engine's candidate segments doubling as the
review UI itself). Not `Timeline` (an event log — dot + title per item, not
a duration-proportional axis) and not a `RangeSlider` composition (N
independently-labelled, non-adjustable regions with per-region review
state, not one draggable min/max pair). Drag-to-resize a segment's
boundaries was explicitly deferred to a possible v2. A follow-up request
added `trimmable` — one continuous, draggable range independent of
`segments`, reusing `Audio`'s own cross-clamped trim-handle shape, reporting-
only since `SegmentTrack` owns no media element to constrain playback on.

**Canvas: `renderBackdrop` + controlled `viewport`, and `Panel`** — shipped
(Phase 31, see `docs/SPEC.md`), closing two entries a PDF editor consumer
had logged as sanctioned stopgaps in its own `COMPONENT_REQUIREMENTS.md`:

1. _"No first-class positioned-over-external-content canvas block kind"_ —
   the consumer overlays selectable text/image/link elements on top of a
   `pdf.js`-rendered page bitmap, and had been composing `useCanvasViewport()`
   plus a manually-transformed wrapper `<div>` to keep the backdrop
   pixel-locked to `Canvas`'s pan/zoom. `Canvas` now takes `renderBackdrop`
   (rendered beneath every block, inside the same world transform, and
   `aria-hidden` since a raster page carries no text of its own) and a
   controlled `viewport`/`defaultViewport`/`onViewportChange` triple, so an
   externally-rendered layer can read and drive the same viewport state
   without reaching into `useCanvasViewport` directly.
2. _"No persistent, non-modal docked panel container component"_ — the
   consumer's property panel (select a block/run, see its font/size/color,
   stay open while clicking around the canvas) had been `Box` + `Card`
   composed by hand, because `Sidebar` is a fixed nav-item list and `Drawer`
   is a portaled overlay that closes on outside click — wrong for a panel
   meant to coexist with an interactive surface the user keeps clicking on.
   `Panel` is the missing shape: non-modal, non-portaled, always in flow
   like `Sidebar`'s default mode, with arbitrary `children` (plus `header`/
   `footer` pinned rows) instead of a fixed nav-item API, and a `dock` prop
   (`start` | `end`) controlling which edge loses its border.

Both were "non-blocking" entries (a documented composition already covered
them) rather than urgent fixes — promoted to first-class support once the
design-system owner reviewed the request, not because the stopgaps were
broken.

---

## Cross-check against the AI-chat-interface taxonomy

The list below was checked against a general taxonomy of AI chat/copilot UI
elements (ChatGPT/Claude/Gemini/Copilot/Perplexity-style surfaces). Anything
already shipped above (or already on the Phase 18-19 roadmap) is left off this
list. Remaining items are genuinely new component surfaces this library
doesn't have yet — grouped by the taxonomy's own sections, with `(covers ...)`
noting which existing/roadmap component already satisfies part of that need.

### Conversation area (chat-specific)

- Message bubble variants: user / AI / system / tool / error / status /
  notification message (covers: `Card`, `Alert`, `Toast` for the visual
  shells; the chat-role semantics themselves are net-new)
- Sender label + timestamp row (covers: `Label`, `Caption` for the text
  primitives; no dedicated timestamp-formatting component)
- Inline citation marker (distinct from a citation/source card, see below)
- Math rendering (LaTeX)
- Embedded interactive widget host (generic slot for the widgets in
  "Specialized AI Widgets" below)

### Composer

- Voice input control (covers: none — see Voice Interface below)
- Camera capture control
- Mention picker
- Slash command picker
- Prompt template picker
- Token estimate / character counter readout (covers: `Statistic` for
  display, but no live-counting input helper)
- Grammar-suggestion / autocomplete-in-editor affordance

### AI response components

- Source/citation card (footnote-style reference, distinct from generic
  `Card`)
- Copy / download / run / expand / collapse code toolbar (covers: `Code`
  for the block itself; the action toolbar is net-new)
- Chart / graph rendering surface (data-viz, distinct from `Table`/
  `DataGrid`)
- PDF viewer
- Map embed

### Generation status

- Typing / "thinking" indicator
- Streaming text cursor
- Tool-execution / searching / reading / planning status line (covers:
  `Progress`/`Spinner`/`CircularProgress` for the visual primitive; the
  labeled status semantics are net-new)

### Message actions

- Regenerate / continue / improve / simplify / explain / translate /
  summarize / expand / shorten action set (covers: `Button`/`IconButton`
  as the underlying control; this is a curated action-bar composition)
- Feedback control (thumbs up/down, report, flag, rating) (covers:
  `Rating` for star-style rating; thumbs/report/flag are net-new)

### Reasoning UI

- Thinking block / reasoning summary (collapsible) (covers: `Accordion`
  for the disclosure mechanics; the reasoning-trace content model is
  net-new)
- Tool trace / search trace / execution log viewer
- Confidence / verification-status indicator

### Memory components

- Saved/retrieved memory list item, memory editor, "forget" action
  (covers: `KeyValueList` for simple display; editing/forgetting flows
  are net-new)

### Model & generation controls

- Model picker (covers: `Select`)
- Temperature / creativity / verbosity / reasoning-effort control
  (covers: `Slider`/`RangeSlider`)
- Tool-permission toggle list (covers: `Switch`, `FormGroup`)

### Voice interface

- Microphone / push-to-talk control
- Live transcription display
- Voice waveform visualizer
- Voice selection picker (covers: `Select`)
- Interrupt / mute / speaker controls (covers: `IconButton`)

### Image generation UI

- Style preset picker, seed field, variation/upscale actions (covers:
  `Select`/`NumberField`/`Button`; the generation-specific composition is
  net-new)
- Inpainting / outpainting canvas
- Aspect ratio picker (covers: `AspectRatio` as the display primitive;
  no dedicated _picker_ control yet)

### Canvas / workspace — **reopened, mostly shipped**

This section was excluded on the grounds that it needed "a full canvas
engine". That holds for a `<canvas>` implementation and not for a DOM one:
blocks are absolutely-positioned real elements inside a single transformed
world div, so no engine is involved, every existing component can be a block,
`--ds-*` tokens and all three themes apply for free, and blocks stay focusable
and present in the accessibility tree.

- Whiteboard / infinite canvas — ✅ `Canvas` (pan, zoom, marquee, snap)
- Sticky notes — ✅ `StickyNote`
- Diagram / flowchart / mind-map editor — ✅ `CanvasShape` + `CanvasConnector`
  (the flowchart vocabulary and three edge routings); mind-map auto-layout is
  not built
- Affinity mapping / clustering — ✅ `Canvas`'s `aiCluster` (groups notes by
  theme into titled `CanvasFrame`s; the model supplies the grouping, the
  library supplies the geometry)
- Block catalogue — ✅ code, table, link, checklist and chart blocks alongside
  sticky/text/image/shape/divider/embed/frame; `CanvasChecklist` is the only
  new component, the rest delegate to `Code`/`Table`/`Link`/`ChartSurface`
- Diagram generation from a description — ✅ `Canvas`'s `aiDiagram` (the model
  supplies a graph of nodes and edges, `canvasDiagram.ts` ranks and lays it
  out); mind-map auto-layout is now covered by the same layered layout
- Drawing & selection tools — selection ✅; **freehand ink is still excluded**,
  and is the one item the original reasoning got right. Thousands of points per
  stroke as SVG paths is the case a raster layer genuinely serves better.

### Node graph — new standalone family, built from a real feature request

A directed graph of connectable, groupable nodes, each holding arbitrary data
(a string, a form value, or an entire scene parsed from another module — a
`Canvas` `scene`, a `Document`'s `pages`). Deliberately **not** a `Canvas`
block kind: the request was for nodes and node groups "referred on other
modules", which argues for a standalone family with its own exported data
shape and pure functions (`NodeGraphData`, `computeNodeOutput`,
`canConnect`/`wouldCreateCycle` in `utilities/nodeGraph.ts`) rather than
coupling a flow-graph data model to `Canvas`'s block reducer and pan/zoom
geometry, the same way `KanbanBoard` stayed separate from `Canvas` rather than
becoming another block kind.

- Node with input/output connections — ✅ `Node` (port buttons), `NodeConnector`
  (the SVG edge), `NodeGraph` (owns dragging, click-to-connect, selection)
- A connected node's output "holding all of" its upstream node's info — ✅
  `computeNodeOutput`: derived on every read as `{ [upstream.id]:
upstream.data, [this.id]: this.data }`, recursively through a chain, not a
  value copied once at connect time — so it always reflects the current graph
- Node groups with name + rename — ✅ `NodeGroup` (renamable label,
  `onUngroup`), grouped via `G` with 2+ nodes selected
- Nodes/groups referenced from other modules — ✅ the data (`NodeGraphData`)
  and pure functions are the public surface; nothing needed lives only inside
  `NodeGraph`'s own state

### File workspace / artifact panels

- File explorer / folder tree (covers: `TreeView`)
- Document tabs (covers: `Tabs`)
- Diff viewer
- Version history (covers: `Timeline` for the display primitive; diffing
  logic is net-new)
- Spreadsheet / presentation / notebook / HTML preview panels (covers:
  `Table`/`DataGrid` for spreadsheet-like grids only)
- Embedded code editor (distinct from the read-only `Code` block)

### Collaboration

- Live cursors, comments, @mentions, presence indicators (covers:
  `AvatarGroup` for presence display only)

### Notifications

- Connection status / offline / sync-status indicator (covers: `Banner`,
  `Toast` as the visual shell; the connectivity semantics are net-new)

### Settings

- Appearance settings (theme/font-size/density/accent) — theming itself
  is handled by `ThemeProvider`/`variables.css`, but no settings-panel
  component exists to edit it
- Behavior toggles (auto-scroll, streaming, enter-to-send) (covers:
  `Switch`)
- Privacy controls (chat history, memory, data export/delete) (covers:
  `Button`/`Dialog` as primitives; no dedicated privacy-settings surface)

### Search

- Semantic/web search result list, search filters panel (covers:
  `SearchField` for the input only)

### Export

- Copy conversation / export to PDF / DOCX / JSON / share-link action
  set (covers: `Button`; no dedicated export-menu composition)

### Authentication

- Login / logout / user-profile / workspace switcher / org switcher /
  subscription-status (covers: `Avatar`, `Menu`/`Dropdown` as primitives;
  no dedicated auth components)

### Context management

- Context-window / token-usage indicator (covers: `Statistic`,
  `Progress`)
- Context-truncation warning (covers: `Alert`)
- Active-files / active-tools / active-memory tray

### Error handling

- Rate-limit warning, tool-failure, unsupported-file notices (covers:
  `Alert`/`Banner` as the visual shell; the specific error taxonomy is
  net-new)

### AI capabilities panel

- Capability toggle list (web browsing, code execution, vision, voice,
  memory, connectors, plugins) (covers: `Switch`, `List`)

### Multi-modal components

- Camera preview / image annotation / OCR preview
- Audio recorder (covers roadmap: `Audio`)
- 3D model viewer

### Advanced interaction patterns

- Branch/fork conversation, compare responses side-by-side, multi-agent
  view, parallel generations, conversation timeline, prompt chaining,
  workflow builder (covers: `Timeline` for the timeline display only;
  everything else is net-new)
- Undo/redo control (covers: `Button`/`IconButton`)

### Developer & power-user features

- System-prompt editor, prompt/function-call inspector, JSON viewer,
  API-response viewer, token-usage/latency/cost stats, log viewer, debug
  mode (covers: `Statistic`/`KeyValueList` for simple stat display; the
  inspector/viewer tooling is net-new)

### Specialized AI widgets

- Weather / stock / flight / package-tracking / sports-score / currency
  / timer / poll / quiz cards (covers: `Card` as the shell, `Calendar`
  for calendar widgets specifically; each widget's data model is net-new)

### Conversation metadata

- Conversation title / tags / last-updated / participants / model-used /
  project-association display (covers: `Heading`, `Tag`, `Caption`,
  `AvatarGroup` as primitives; no bundled metadata-header component)

### Enterprise features

- Audit log, compliance notice, access-control, approval-workflow,
  knowledge-base selector, usage-analytics (covers: `Table`/`Alert` as
  primitives; the enterprise-specific compositions are net-new)

### Mobile-specific

- Bottom-sheet composer (covers: `Drawer` `placement="bottom"`)
- Haptic feedback (not a visual component)
- Adaptive keyboard toolbar
- Voice-first controls, camera shortcut (see Voice Interface, above)
