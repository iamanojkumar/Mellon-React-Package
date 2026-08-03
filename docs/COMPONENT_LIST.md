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
- Code (AI: `aiExplain`)
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
- Select (AI: `aiSuggest`)
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

## AI Chat

- MessageBubble
- MessageMeta
- CitationMarker
- TypingIndicator
- StreamingCursor
- MessageActionBar
- FeedbackControl
- ThinkingBlock
- ToolTraceViewer
- StatusLine
- CitationCard
- CodeBlockToolbar
- ChartSurface
- MentionPicker
- SlashCommandPicker
- PromptTemplatePicker
- TokenCounter
- ConversationHeader
- MemoryListItem
- MemoryEditor

The "AI Chat" section above is the complete, shipped output of the
five-phase "AI Chat Components" track (Phases 23-27) — see
`docs/SPEC.md`'s "AI Chat Components track: complete (Phases 23-27)"
for the full per-phase build notes and the "Out of scope" list of
adjacent subsystems (voice, canvas, 3D, enterprise, ...) deliberately
excluded from this track.

---

**Shipped so far:** 123 components (Phases 1-17, 20-21, and 23-27, per
`docs/SPEC.md`). `src/components/*/` (excluding `index.ts`) is the
authoritative count.

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

## AI enhancements shipped (Phase 22)

All 26 opportunities below are done, across two shapes (see `docs/SPEC.md`'s
condensed Phase 22 writeup for the full per-component list and the two real
bugs found) — also marked inline above:

- **18 components** reuse `AISuggestionPopover`/`AITriggerButton` (the
  Phase 21 "trigger → popover" shape): `Code`, `Paragraph`, `Blockquote`,
  `Input`, `ColorPicker`, `FileUpload`, `ErrorMessage`, `Card`, `Table`,
  `Accordion`, `Timeline`, `Calendar`, `Statistic`, `KeyValueList`,
  `Banner`, `Image`, plus `TimePicker` (inherited for free via `Select`
  pass-through — see below).
- **8 components** follow the `CommandPalette` resolver shape (no shared
  AI primitive, a consumer-owned `resolve` function returns real
  executable items): `Select`, `MultiSelect`, `Combobox`, `Autocomplete`
  (inherited for free via `Combobox` pass-through), `Menu`, `Dropdown`,
  `ContextMenu` (forwards to its internal `Menu`), `TreeView`.
- `DatePicker`'s `aiParse` is the one exception to both shapes — its panel
  is already `Popover`-like chrome, so nesting a second
  `AISuggestionPopover` inside it would violate CLAUDE.md's "no nested
  overlay boxes" rule; its query field + accept/reject UI is hand-rolled
  directly into the panel instead.

## Backlog

**Phases 18-19** (see `docs/SPEC.md`):

- Mobile: Pull To Refresh, Swipe Actions (Action Sheet is covered by `Drawer`)
- Media: Video, Audio
- Utilities: Scroll Area, Infinite Scroll, Split Pane, Resizable, Masonry

## AI opportunity reference (Phase 22, shipped — kept for context)

The 95 non-flagship components (103 shipped minus the 6 already
AI-enhanced in Phase 21 minus the 2 AI infra primitives,
`AITriggerButton`/`AISuggestionPopover`, which are enhancement building
blocks, not targets) were split into components with a genuine AI
opportunity and components with none — forcing an AI feature onto every
remaining component would
violate the "don't build features beyond what's needed" principle in
`CLAUDE.md`. 26 have a real opportunity; 69 don't (pure layout/structural
primitives, security-sensitive fields, transient or content-less surfaces).
All 26 are now shipped — see the "AI enhancements shipped (Phase 22)"
section above. Each opportunity note below names the prop in the same
`aiXxx` naming family as Phase 21's shipped props, and — where it reuses
the shared `AISuggestionPopover`/`AITriggerButton` primitives vs. the
`CommandPalette` resolver shape — which shape it covers, mirroring the
"(AI: propName)" / "(covers ...)" annotation style used for shipped
components above.

### Has a real AI opportunity (26 — all shipped)

**Typography** — Code ✅ shipped (`aiExplain` — explain a code block;
covers via `AISuggestionPopover`, same shape as `Alert`), Paragraph ✅
shipped (`aiSummarize`/`aiExplain` — summarize or simplify body text;
covers via `AISuggestionPopover`), Blockquote ✅ shipped (`aiExplain` —
explain quoted text in context; covers via `AISuggestionPopover`).

**Inputs** — Input ✅ shipped (`aiAutocomplete` — generic free-text assist;
covers via `AISuggestionPopover`, same shape as `TextArea`'s `aiRewrite`),
Select ✅ shipped (`aiSuggest` — recommend the best option from context;
covers via `CommandPalette`'s resolver shape, not a popover — output must
become a real selection), MultiSelect ✅ shipped (`aiSuggest` — recommend
an option set; same shape as Select), Combobox ✅ shipped (`aiSearch` —
semantic ranking of list results; covers via `CommandPalette`'s
`aiSearch.onQuery` shape), Autocomplete ✅ shipped (`aiSearch` — inherits
Combobox's opportunity for free, it's a thin wrapper — zero new code),
ColorPicker ✅ shipped (`aiSuggest` — generate a matching color/palette;
covers via `AISuggestionPopover`), DatePicker ✅ shipped (`aiParse` —
natural-language date entry, e.g. "next Friday"; hand-rolled accept/
reject directly in its own panel rather than reusing `AISuggestionPopover`
— see "AI enhancements shipped" above for why), TimePicker ✅ shipped
(`aiSuggest` — inherits `Select`'s opportunity for free, it's a thin
wrapper — zero new code), FileUpload ✅ shipped (`aiDescribe` — per-file
describe/summarize trigger; covers via `AISuggestionPopover`).

**Form** — ErrorMessage ✅ shipped (`aiExplain` — explain a validation
error or suggest a fix; covers via `AISuggestionPopover`, same shape as
`Alert`'s `aiExplain`).

**Navigation** — Menu ✅ shipped (`aiSuggest` — contextual action
suggestions; covers via `CommandPalette`'s resolver shape), Dropdown ✅
shipped (`aiSuggest` — same shape
as Menu), ContextMenu ✅ shipped (`aiSuggest` — same shape as Menu,
forwarded straight to its internal `Menu`), TreeView ✅ shipped
(`aiSearch`/`aiNavigate` — jump to a node via natural language; covers via
`CommandPalette`'s resolver shape).

**Data Display** — Card ✅ shipped (`aiExplain`/`aiSummarize` — summarize
arbitrary card content; covers via `AISuggestionPopover`, same shape as
`Alert`), Table ✅ shipped (`aiTableQuery` — same shape as `DataGrid`, but
prompted from the rendered table's extracted text since `Table` has no
structured `data` prop), Accordion ✅ shipped (`aiSummarize` — summarize a
collapsed section's content, lives on `Accordion.Content`; covers via
`AISuggestionPopover`), Timeline ✅ shipped (`aiSummarize` — summarize a
history/sequence of events; covers via `AISuggestionPopover`), Calendar ✅
shipped (`aiQuery` — natural-language schedule query, e.g. "what's on
Friday"; covers via `AISuggestionPopover`), Statistic ✅ shipped
(`aiExplain` — explain why a metric changed; covers via
`AISuggestionPopover`), KeyValueList ✅ shipped (`aiExplain` — explain or
query structured key/value data; covers via `AISuggestionPopover`).

**Feedback** — Banner ✅ shipped (`aiExplain` — same shape as its sibling
`Alert`; covers via `AISuggestionPopover`).

**Media** — Image ✅ shipped (`aiDescribe` — generate alt-text/caption via
a vision-capable `AIClient`; covers via `AISuggestionPopover`).

### No sensible AI surface (69)

**Foundations (11)** — Box, Flex, Grid, Stack, Inline, Spacer, Container,
Center, Divider, AspectRatio, VisuallyHidden. Pure layout primitives, no
content or semantics of their own.

**Typography (8)** — Text, Heading, Display, Label, Caption, Link, List,
ListItem. Too generic/structural to own distinct AI-actionable content
separate from their container.

**Buttons (6)** — Button, IconButton, ButtonGroup, ToggleButton,
SplitButton, FloatingActionButton. Pure action controls — the vehicle for
AI actions elsewhere (e.g. `AITriggerButton`), not an AI target themselves.

**Inputs (12)** — PasswordField (security — never AI-assist a password),
NumberField, EmailField, PhoneField (narrow validated formats; free-text
generative assist doesn't fit), OTPInput, PinInput (security codes),
Checkbox, RadioGroup, Switch (binary/discrete toggles, nothing to
generate), Slider, RangeSlider, Rating (bare numeric value pickers).

**Form (5)** — Field, Fieldset, HelperText, FormGroup, FormSection.
Structural wrappers, no distinct content of their own.

**Navigation (6)** — Navbar, Sidebar, Breadcrumb, Tabs, Pagination,
NavigationRail. Structural navigation shells/destinations, nothing to
query or generate.

**Data Display (5)** — Avatar, AvatarGroup, Badge, Chip, Tag. Pure visual
identity/status labels, nothing to explain or generate.

**Feedback (6)** — Toast (too transient for an interactive AI popover),
Progress, CircularProgress, Skeleton, Spinner, LoadingOverlay. Pure state
indicators, no content.

**Overlays (5)** — Dialog, Drawer, Popover, Tooltip, HoverCard. Generic
chrome/shells for arbitrary content — any AI enhancement belongs to what's
rendered inside them, not the shell itself.

**Media (2)** — Figure (thin wrapper around `Image` + caption, redundant
with `Image`'s own opportunity), Carousel (arbitrary slide container,
nothing of its own to act on).

**Utilities (2)** — Portal, FocusTrap. Pure infrastructure, no content.

**Mobile (1)** — BottomNavigation. Structural nav, same reasoning as
Navbar/Sidebar.

---

## Cross-check against the AI-chat-interface taxonomy

The list below was checked against a general taxonomy of AI chat/copilot UI
elements (ChatGPT/Claude/Gemini/Copilot/Perplexity-style surfaces). Anything
already shipped above (or already on the Phase 18-19 roadmap) is left off this
list. Remaining items are genuinely new component surfaces this library
doesn't have yet — grouped by the taxonomy's own sections, with `(covers ...)`
noting which existing/roadmap component already satisfies part of that need.

The genuinely chat-specific subset of this list became the "AI Chat"
section above (Phases 23-27, all shipped). Everything else here (voice,
canvas/workspace, 3D, enterprise, ...) is intentionally left un-phased —
see `docs/SPEC.md`'s "Out of scope" note in the "AI Chat Components
track: complete" section for why.

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
