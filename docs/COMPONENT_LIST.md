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
- TextArea (AI: `aiRewrite`)
- PasswordField
- SearchField (AI: `aiSearch`)
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
- CommandPalette (AI: `aiSearch.onQuery`)
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
- DataGrid (AI: `aiTableQuery`, `aiRowExplain`)
- Accordion
- Timeline
- Calendar
- Statistic
- EmptyState (AI: via existing `action` slot — no new prop)
- KeyValueList

## Feedback

- Alert (AI: `aiExplain`)
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

## AI

- AITriggerButton
- AISuggestionPopover

---

**Shipped so far:** 93 components (Phases 1-17 and 20-21, per
`docs/SPEC.md`).

## AI enhancements shipped (Phase 21)

Six existing components gained opt-in AI props in Phase 21 — marked inline
above as `(AI: propName)`, not counted as separate components since
they're the same component with a new prop family. Behavior notes:

- `TextArea`'s `aiRewrite` and `SearchField`'s `aiSearch` both open an
  `AISuggestionPopover` from a trigger button.
- `Alert`'s `aiExplain` is read-only — no accept/reject, nothing to
  replace.
- `DataGrid`'s `aiTableQuery` is a toolbar action; `aiRowExplain` is
  per-row.
- `CommandPalette`'s `aiSearch.onQuery` is the one flagship that skips the
  shared `AISuggestionPopover`/`AITriggerButton` primitives entirely —
  results must resolve to real executable items, debounced and merged
  into the listbox as a synthesized group.
- `EmptyState` needed no code change — its existing `action` slot already
  composes arbitrary UI; shipped as a Storybook story only.

## Backlog

**Phases 18-19** (see `docs/SPEC.md`):

- Mobile: Pull To Refresh, Swipe Actions (Action Sheet is covered by `Drawer`)
- Media: Video, Audio
- Utilities: Scroll Area, Infinite Scroll, Split Pane, Resizable, Masonry

**Phase 22 — AI enhancements** (see `docs/SPEC.md`): AI features on the
remaining ~85 components, cross-checked against a general AI-chat-UI
taxonomy in the tables below.

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

### Canvas / workspace

- Whiteboard / infinite canvas
- Sticky notes
- Diagram / flowchart / mind-map editor
- Drawing & selection tools

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
