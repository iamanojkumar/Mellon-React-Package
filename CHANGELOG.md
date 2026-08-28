# @mellon-design/react

## 0.10.0

### Minor Changes

- 92061c7: `CanvasBlockOwnProps` gains `chrome?: boolean`, threaded to `Document.chrome` for the `document` block kind (default stays `false`, unchanged behavior). Lets a host render one specific document-kind `CanvasBlock` with `Document`'s standalone, self-contained viewer (list/grid view, zoom) instead of the bare embedded face — useful for a "focused page" view independent of `Canvas`'s own pan/zoom.
- 92061c7: Restyled `Node` as a colored pill/chip (new `color`/`fill` props, `--ds-radius-full` by default, a body only when it holds `children`) and fixed a latent bug where its rename input leaked arrow/Delete keys to an ancestor's keyboard handling. `NodeConnector`/`CanvasConnector` default to a thinner stroke to match.

  Added a `node` `CanvasBlockData` kind (reusing `Node` in `fill` mode) so pill nodes can be placed directly on `Canvas`, connected via click-to-connect ports through `Canvas`'s own connector system. Added `CanvasToolbar` (`Canvas`'s new `shapeToolbar` prop) — a small floating bar for inserting a sticky note, shape, node, or frame by hand, with no `AIProvider` or resolver required.

### Patch Changes

- 92061c7: `Sidebar.Item as="button"` no longer shows native `<button>` chrome (background, beveled border, platform font) underneath its own styling — `.item` now resets `background`/`border`/`appearance`/`font` too, matching the earlier `text-align` fix for the same `as="button"` gap. All four are no-ops for the default `as="a"`/`as="div"` targets.

## 0.9.0

### Minor Changes

- bd3643e: `CanvasChatPanel` keeps the full chat history, is resizable, and takes arbitrary consumer context.

  - **Full scrollable history, not just the last turn.** Every `lastMessage`
    that changes to a new value is appended to the chat history alongside the
    prompt that led to it, instead of replacing the single previously-shown
    exchange. A consumer that already has a reply in hand on mount (not just
    one reached through a live `submit`) shows it immediately, same as before.
  - **Fixed: the "Thinking" summary's animated dots kept running after the
    reply had already arrived.** They were tied to `thinking` text being
    present, not to actual busy status. The busy indicator is now a separate
    `TypingIndicator`, shown only while a request is actually in flight
    (`status` `'loading'`/`'streaming'`) and gone the instant it settles.
  - **Resizable.** Drag the corner handle, or Alt+Arrow (Shift for a bigger
    step) while any focusable part of the panel has focus — the same
    pointer-handle-plus-keyboard-equivalent shape `Canvas`'s own block resize
    handles use. Clamped to `boundsRef` the same way dragging already was.
  - **New `context` prop** (and `buildCanvasChatPrompt`'s new third parameter):
    arbitrary extra context folded into every submitted prompt alongside the
    current selection — anything the consuming app wants the model to see that
    isn't canvas block data (app state, the signed-in user, a page's own
    metadata). A plain string rides verbatim; anything else is
    JSON-serialized. `Canvas` gains a matching `chatContext` pass-through prop.
  - The panel's drop shadow is lighter (`--ds-elevation-sm`, was `-md`).

- bd3643e: Close four gaps from a consumer app's own gap log.

  - **`CanvasShape` gains `editing`/`onTextChange`/`onEditingEnd`** — double-click
    a `shape` block to edit its label in place, the same as `StickyNote`.
    `Canvas`'s `aiRewrite` now wires a "Rewrite with AI" trigger through for
    `shape` too, rendered at the `CanvasBlock` level (a selection-gated overlay,
    opposite corner from `CanvasFillPicker`'s trigger) rather than inside
    `CanvasShape` itself, since a trigger drawn inside a clipped shape
    (`diamond`/`triangle`/`parallelogram`) would clip away with it. Every other
    block kind still has no click-to-edit entry point on the canvas at all, so
    `CanvasBlockOwnProps.aiRewrite`'s doc comment now says so explicitly instead
    of the prop silently no-op-ing for them.
  - **`AISuggestionPopover` gains `editablePrompt`/`onSubmit`** — opts out of the
    default "fetch on open" behaviour in favour of an editable textarea
    pre-filled from `editablePrompt`, so the person using the app (not just the
    integrating developer) can steer the AI instruction before it's sent.
    `StickyNote` adopts this behind a new `aiRewriteEditable` flag, off by
    default — an existing `aiRewrite` consumer's behaviour is unchanged.
  - **`Sidebar.Item` gains an `actions` slot**, rendered as a sibling of the
    item's own link/button within the same `<li>` rather than nested inside it
    — nesting a real `<button>` inside this item's own `<a>`/`<button>` is
    invalid HTML and breaks click handling (the outer element's click would
    also fire). Same guard `KanbanCard`'s own `actions` slot uses.
  - **Fixed: the internal AI-generation fallback prompt's only inline `"create"`
    example hardcoded `kind:"sticky"`**, anchoring every model-generated block
    to that kind regardless of content — a decision point or a start/end state
    came back as a sticky note instead of a differently-shaped flowchart
    element. `buildCanvasPrompt` now illustrates `"create"` with two different
    kinds.

  A fifth ask from the same gap log (icon coverage for research/design-tool
  categories) lives in `@mellon-design/icons`, a separate package — not
  actionable in this repo.

- bd3643e: Add a `Node`/`NodeGraph` family, and strip `StickyNote`'s shadow, border, and radius.

  - **New standalone `Node`/`NodeConnector`/`NodeGroup`/`NodeGraph` family** —
    not a `Canvas` block kind, so it and its data can be used or referenced from
    any module. A node's `data` is `unknown`: it can hold a string, a form
    value, or an entire scene parsed from another module (a `Canvas` `scene`, a
    `Document`'s `pages`) — `NodeGraph` never inspects it, only positions the
    box and hands it to `renderNode`.
  - **Connecting is derived, not copied.** Connecting node A's output to node
    B's input doesn't merge data at connect time. `computeNodeOutput` (new,
    `utilities/nodeGraph.ts`) derives B's effective output — `{ [A.id]: A.data,
[B.id]: B.data }`, through a whole chain — on every read, from any module,
    so it always reflects the current graph. `canConnect`/`wouldCreateCycle`
    reject a self-connection, a duplicate, or anything that would close a loop,
    checked before a connection is made.
  - **Connecting is click-driven, not drag-driven**: click a node's output port
    to arm it, then a target's input port to complete the connection (or
    Escape to cancel) — reachable from the keyboard the same way every other
    pointer-only gesture in this library gets a non-pointer path. Repositioning
    stays pointer-drag-only, with arrow keys as its keyboard equivalent once a
    node is selected, the same split `Canvas` draws between spatial dragging and
    keyboard navigation.
  - **Grouping is data, not geometry** — a `NodeGroupData.nodeIds` list, unlike
    `CanvasFrame`'s geometric containment. Shift-click multi-selects; `G` groups
    2+ selected nodes into a new named `NodeGroup` (double-click to rename,
    `onUngroup` to dissolve without touching members); Delete removes selected
    nodes along with any connection touching them.
  - **`StickyNote` loses its box-shadow, border, and border-radius** — the tone
    accent edge (`border-inline-start`) is unchanged.

### Patch Changes

- bd3643e: `Canvas`'s surface loses its outer border and border-radius — it now sits flush, edge to edge, rather than as a rounded, bordered panel.
- bd3643e: Close three more gaps from a consumer app's gap log.

  - **Fixed: `Sidebar.Item as="button"` centered its label text.** `<button>`
    carries a browser-default `text-align: center` that the item's own CSS
    never reset; every other `as` target (`a`, `div`) has no such default.
    `.item` now sets `text-align: left` explicitly.
  - **Fixed: `MessageBubble`'s `user` variant reused `Card`'s
    `--ds-radius-lg`**, which reads as a fully-rounded pill/button on a short
    one-line message (all four corners round into each other when the box is
    short relative to that radius). `.bubble.bubble` now sets its own,
    smaller `border-radius: var(--ds-radius-md)` instead of inheriting
    `Card`'s.
  - **Fixed: the internal AI-generation fallback prompt's `"Block kinds:"`
    line never mentioned the `document` kind** (shipped in `0.8.0`), so a
    request that should write into a `document` block's `pages` silently
    degraded to a chat-only answer — the model was never told the kind, or
    its `update` patch shape, existed. `buildCanvasPrompt` now lists
    `document (pages, header?, footer?)` alongside the other kinds and states
    the exact `update` patch shape for it.

  A fourth item from the same gap log (a focus/distraction-free viewport for
  a canvas-embedded `document` block) turned out to already be shipped and
  documented — double-clicking a `document` block already opens its editor
  and enters `Canvas`'s own locked focus mode (`F`/`L`/`Escape`); no library
  change was needed there, just discoverability on the consumer's side. A
  fifth ask (icon coverage for research/design-tool categories) lives in
  `@mellon-design/icons`, a separate package — not actionable in this repo.

## 0.8.0

### Minor Changes

- 7f02db9: Add a floating AI chat panel to `Canvas`.

  - **New `CanvasChatPanel` component**, and `Canvas` gains `aiPromptFloating`.
    With `aiPrompt` and `aiPromptFloating` both set, the prompt bar decouples
    from the static row above the surface and floats as a compact draggable
    card over the canvas instead — same `resolveCommands`/`useCanvasCommands`
    pipeline, so it shares the static bar's single in-flight request, outcome
    classification, undo toast, and `CanvasChangePreview` review panel rather
    than owning a parallel one. Styled to a reference mockup: rounded card, a
    bare drag-handle bar, a borderless input (`CanvasPromptBar` gains a
    `variant="minimal"` for it), and the response area's scrollbar hidden.
  - **Movable, minimizable, never closable.** Drag it by its header — bounds
    are read once at drag-start rather than on every pointer move, which is
    what made the previous version feel laggy. Minimize by double-clicking the
    header, its hover/focus-revealed icon button, or an opt-in
    `minimizeShortcut` chord (e.g. `'mod+j'` — `'mod'` matches Ctrl or Cmd) the
    host app supplies and picks itself; minimized shows a title bar instead of
    the bare handle. There is no close control — the assistant stays mounted,
    only ever expanded or minimized, and always has control over the canvas
    through the same command pipeline every other AI entry point uses.
  - **Shows the exchange, not just the reply.** The last submitted prompt
    renders as a `MessageBubble` above the reply, which itself renders as plain
    text.
  - **Selection-aware, including a selected frame's contents.** The canvas's
    current selection — full block data, not just ids — rides along on every
    prompt. Selecting a frame now expands this to the frame's own data _plus_
    every block visually inside it (`canvasGeometry.ts` gains
    `frameMembers`/`withFrameMembers`, computed live from current positions,
    not a stored relationship), and dragging or keyboard-nudging a selected
    frame carries those same blocks along with it — without adding them to the
    selection itself, so deleting a selected frame still only deletes the
    frame. The panel names the selection chip-by-chip up to
    `MAX_SELECTION_CHIPS`, then collapses to one "N items selected" chip.
  - Positioned in screen space, not canvas space: panning or zooming the scene
    underneath never drags the panel along with it.
  - **Fixed: the panel could be dragged outside the canvas surface.** The drag
    clamp assumed the panel sat flush against its container's corner; it
    actually sits inset by its own margin, so the old bound was off by that
    margin and let the panel escape past the surface's top/left edge. Now
    measured from the panel's real on-screen rect instead of an assumed anchor.
  - **Fixed: pressing anywhere on the panel also reached the canvas underneath
    it** — starting a marquee-select or clearing the canvas selection (since
    nothing stopped the pointerdown from bubbling past the panel). The panel
    now stops that at its own root.
  - **Fixed: the marquee-select rectangle used a filled background**, hiding
    exactly the blocks it was being drawn over to select. It's outline-only
    now, and the outline itself is a solid neutral gray rather than a
    focus-blue dashed line, which read as a validation/focus state rather than
    a selection tool.
  - **`CanvasResolution` and `useCanvasCommands` gain `thinking`.** The model's
    own brief account of why it chose its commands (or none) rides alongside
    `message` in the same JSON response. Rendered as a collapsed, expandable
    "Show reasoning" `ThinkingBlock` on the static prompt bar, and as a
    compact, **non-expandable** two-line summary ("Thinking" plus one
    CSS-truncated line) on `CanvasChatPanel` — there is no control that reveals
    more of it there. Rendered verbatim like `message`, never parsed for
    intent; only the main prompt path (`submit`) populates it — `cluster` and
    `diagram` resolve to a different response shape and clear any stale
    `thinking` from an earlier prompt rather than showing it against an
    unrelated outcome.

- 7f02db9: Add object snapping, a single-element focus mode, and per-block fill colors to `Canvas`.

  - **Snap to objects.** Dragging a block (or a multi-selection, or a frame
    with its members) now magnetically aligns to nearby blocks' edges and
    centers, within a small threshold, and draws a thin alignment guide line
    while it's snapped — `canvasGeometry.ts` gains `snapToObjects` (pure,
    independently testable) plus `rectBounds`, a plain-rect generalization of
    the existing `boundsOf`. Object-snap takes priority over grid-snap per
    axis; grid-snap (the existing `grid` prop) still applies on any axis with
    no nearby match.
  - **Focus mode.** Press `F` with a block selected to isolate it: the
    viewport zooms and centers on it, and everything else dims (via layering
    against `--ds-color-surface-overlay`, not per-block opacity — no matching
    opacity token exists to alias). While focused, only that one block
    responds to pointer interaction; press `F` again or `Escape` to exit
    (`Escape` leaves the selection alone). Press `L` to lock focus, freezing
    pan/zoom/scroll entirely (wheel, keyboard, and pointer-pan all no-op)
    while the focused block itself stays fully interactive — drag, resize,
    edit, keyboard-nudge all still work locked. Unlocked, panning and zooming
    away from the focused block is still allowed.
  - **New `CanvasFillPicker` component**, and `StickyNote`/`CanvasShape` (plus
    their `CanvasBlockData` kinds) gain `color` — an arbitrary hex fill,
    applied as an inline style, not a design token (the same status as
    `Image.src`: user content, not a hardcoded value). A small trigger shown
    only while a `sticky` or `shape` block is selected opens a popover with
    preset swatches and a full `ColorPicker` for freeform hex — reusing the
    existing `Popover` + `ColorPicker` components rather than a new overlay
    primitive. Layers over `tone`'s existing accent-edge/border-colour styling
    rather than replacing it; there is no contrast guarantee against a colour
    chosen freely.
  - `StickyNote`'s padding increased (`--ds-space-sm` → `--ds-space-md`) for
    more breathing room around the note's text.
  - No new `circle` block kind — `shape:"ellipse"` with width equal to height
    already renders as one; the AI prompt's shape-kind description now says so
    explicitly, so an AI-driven "draw a circle" request produces a
    correctly-shaped ellipse rather than guessing at a non-existent kind.

- 7f02db9: Close five gaps reported from a consumer app.

  - **`RichTextEditor` gains `aiRewrite`** (plus `buildAIPrompt` /
    `aiTriggerLabel`), matching `TextArea`'s prop shape — it was the last text
    surface in the library with no AI affordance. The trigger sits at the end of
    the toolbar row rather than floating over the writing surface, and the
    suggestion is applied as HTML so formatting survives the rewrite. Inert
    without an `AIProvider`, and the markup is byte-identical to before whenever
    it doesn't apply.
  - **`Avatar` gains `color` and `colorFrom`** for tinting the initials
    fallback, so accounts stop looking identical. `colorFrom` hashes any key (an
    account id, an email) into a stable tint. Every tint is a foundation
    `*-subtle` fill with its own hue-matched `*-on-subtle` foreground, measured
    at 12.97:1–16.39:1 in light, dark and high-contrast. The tint is decoration
    only — the initials and accessible name carry identity.
  - **`Input`, `TextArea` and `RichTextEditor` gain `onAIOpenChange`,
    `onAIAccept` and `onAIReject`.** An accepted AI suggestion previously
    reached the consumer as an ordinary `onChange`, indistinguishable from a
    keystroke, leaving a call site no way to instrument the flow.
  - **Fixed: `Breadcrumb.Item as="button"` rendered with native button chrome.**
    A trail step that navigates through a router has no `href`, so `as="button"`
    is a real call site; the module never reset the UA's border/background/
    padding/font-size, and hover/focus were keyed off `a.item` so a button got
    neither. Both fixed.
  - **New tokens**: `--ds-color-status-info` and
    `--ds-color-status-{info,success,warning,danger}-{subtle,on-subtle}` in
    `variables.css`, mapping foundation roles that were already published but
    unaliased.

  Also investigated, and **not** a defect: a suspected `Accordion.Content`
  staleness bug does not reproduce. `Accordion.Content` renders `{children}`
  unconditionally, with no memo, cloning or cached element; two regression tests
  now record that for both open and closed items.

- 7f02db9: `Document`'s header/footer can now be edited in place, and its body editor no longer reads as a boxed control nested inside the page.

  - **`RichTextEditor` gets `variant`/`showToolbar`/`minHeight`.** `variant="plain"` drops the toolbar's and editable surface's own border/background — for embedding inside a host that's already the box (here, `DocumentPage`), where a second nested box was redundant chrome, not a second control. `showToolbar={false}` renders a bare contentEditable surface with no formatting bar, for a header/footer that's a line of text, not a paragraph needing bold/lists/links. `minHeight` overrides the default `8em` sizing (meant for a full page of text) for a single-line use.
  - **New `Document` props**: `headerValue`/`defaultHeaderValue`/`onHeaderChange` and `footerValue`/`defaultFooterValue`/`onFooterChange` — the same controlled/uncontrolled string shape `pages` already has. Supplying any of them switches the header/footer from the static `header`/`footer` `ReactNode` slot to a real editable surface while `editable` is `true`, so the whole page (header, body, footer) is one continuous editable document rather than the body alone.
  - **`DocumentPage`'s header/footer no longer draw a divider** against the body — the three regions read as one page rather than three visually separated boxes.
  - **`Canvas`'s `document` block wires this up**: double-clicking a document block now makes its header and footer editable together with the body (previously only the body entered edit mode), through the same `run`/reducer path `onPagesChange` already used — a hand-typed header and a model-set one go through one path.

- 7f02db9: `Document` now shows one formatting toolbar above the whole page, with a paragraph-style picker, instead of a toolbar wedged into the body alone.

  - **One shared toolbar, not one per region.** Every `RichTextEditor` `Document` mounts for a page (header, body, footer) now renders `showToolbar={false}`; `Document` itself renders a single toolbar above the page while `editable`, acting on whichever of the three surfaces was last focused. It uses the same "save the selection `Range` on blur, restore it immediately before the command" technique `RichTextEditor`'s own link popover already relies on, generalized from one surface to three.
  - **New paragraph-style picker**: `Heading 1`–`6`, `Body`, `Caption`, `Quote`, `Note`, applied via `execCommand('formatBlock', ...)`. `Caption`/`Note` have no native block tag, so both format as `<p>` and are told apart afterward by a CSS class.
  - `RichTextEditor` gains `showToolbar` (already shipped alongside `variant`/`minHeight` in the previous release) as the seam this reuses — `Document` is its first consumer to actually turn it off.

- 7f02db9: `Document` gets a consumer-supplied, double-click-editable `name` label, a table-of-contents panel, and a flat (unrounded) page.

  - **New `name`/`onNameChange` props.** The document's own identity (a file name), supplied by the consumer rather than typed into the page — renders as a small tab-style label above the page's top-left corner, separate from `header`/`headerValue` (in-page content that prints/exports with the page). Double-clicking the tag swaps it for a text input (committed on Enter/blur, discarded on Escape) when `onNameChange` is supplied; without it the tag stays a static label.
  - **New table-of-contents panel** (`tocOpen`/`defaultTocOpen`/`onTocOpenChange`, standalone `chrome` only): lists every `h1`–`h6` found across `pages`, clicking an entry jumps to its page. A toggle icon at the start of the toolbar shows/hides it; both render only when at least one heading exists.
  - **`DocumentPage`'s outer sheet is now flat, not rounded** — `.page.page { border-radius: 0 }` overrides `Card`'s own radius (doubled-class, so it wins regardless of stylesheet load order). A document page reads as a sheet of paper, not a rounded UI card.

- 7f02db9: Add `Document`/`DocumentPage` — a simple multi-page note/resume editor — plus a new `document` `Canvas` block kind.

  - **New `documentAspectRatio.ts` utility.** `DocumentAspectRatio` is a named
    preset union (`'a4' | '16:9' | '4:3'`) plus a custom `{width, height}`
    escape hatch — the same "preset union + custom override" shape used
    elsewhere, so new presets are additive later without a breaking change.
  - **New `DocumentPage` component.** One page's fixed-aspect-ratio surface,
    reusing `Card`'s box rather than duplicating its styling. A compound
    component with optional `Header`/`Body`/`Footer` parts; `Body` takes a
    `layout` (`'single'` default, `'two-column'`, `'sidebar'`), wrapping
    content in `Grid` only for the presets that need one.
  - **New `Document` component.** Manages an array of pages (`pages`, one HTML
    string each) controlled/uncontrolled the same way `Canvas`'s `scene` is —
    the seam a future AI/chat component would edit pages through, the same
    `onPagesChange` a person's own typing already goes through, not a parallel
    path. `editable` mounts a `RichTextEditor` per page (read-only static HTML
    otherwise). Works two ways:
    - Standalone (`chrome` true, the default): a list/grid view toggle, zoom
      controls (buttons and Ctrl/Cmd+wheel), and arrow-key page navigation —
      only when focus isn't inside a page's own text surface, so the caret
      keeps working normally while typing.
    - Embedded, `chrome={false}`: just the active page, for a host that
      already owns pan/zoom — currently only `Canvas`.
  - **Auto-pagination only ever appends a page** once the last page's content
    outgrows its fixed box — it never re-flows already-typed content backward
    across a page boundary. Deferred via `setTimeout`, not
    `requestAnimationFrame`: rAF never fires at all in a backgrounded/unpainted
    tab, confirmed live, which would silently break auto-pagination for a
    canvas app switched away from mid-paste.
  - **New `document` `CanvasBlockData` kind** (`pages`, `aspectRatio`,
    `layout`, `header`, `footer`), rendering `Document` with `chrome={false}`
    inside a canvas block. Double-clicking one opens its editor and enters
    `Canvas`'s own focus mode (from the previous release) **locked by
    default** — the one place in this library where focus doesn't default to
    free-to-look-around, since editing a document's text while the viewport
    can still be panned away from under you is the actual bad experience being
    avoided. Escape exits both the editor and focus together, in one keystroke.
  - **Fixed, found while wiring the above: `Canvas`'s keyboard handler
    unconditionally suppressed every key while any block was being edited**,
    which meant Escape could never reach the focus-exit branch for a
    `document` block's editor (a sticky note's own textarea already stops
    Escape from bubbling that far itself, so this never surfaced before).

## 0.7.0

### Minor Changes

- d1e2d2a: Add `icon`/`iconPosition` props to `Button` for a leading or trailing decorative glyph (hidden while `loading`). Add `@mellon-design/icons` as a dependency — this library previously shipped no icon package, authoring every icon as inline SVG owned by a specific component; the standing "no icon library" rule from `CLAUDE.md` is superseded for icons a consumer supplies through slot props like `Button.icon`, `IconButton`'s children, `Badge.icon`, etc. Icons still bundled inside individual components (`Video`, `Alert`/`Banner`/`Toast`'s `AlertVariantIcon`, ...) are unaffected.
- d1e2d2a: Add `Panel`, a persistent non-modal container meant to dock at a viewport edge and fill its height (property-panel/inspector pattern) — `dock` (`start`/`end`), `header`/`footer` pinned rows around a scrollable body. Add `Canvas`'s `renderBackdrop` (renders beneath every block, inside the world transform, for overlaying selectable blocks on external raster content like a `pdf.js`-rendered page) and a controlled `viewport`/`defaultViewport`/`onViewportChange` triple, with the matching `viewport`/`onViewportChange` options added to `useCanvasViewport`. Both close sanctioned-stopgap entries from a real consumer's component-requirements log — see `docs/COMPONENT_LIST.md`'s Phase 31 entry.

## 0.6.0

### Minor Changes

- 53991dd: Add `trimmable` to `SegmentTrack` — one continuous, draggable "Trim start"/"Trim end" selection independent of `segments`, reusing `Audio`'s own cross-clamped trim-handle shape (drag or arrow-key nudge, `Home`/`End`/`PageUp`/`PageDown`). New props: `trimmable`, `trimRange`/`defaultTrimRange`, `onTrimChange` (`{ start, end }` seconds), `trimStep`.

  Trim state is reporting-only — `SegmentTrack` has no media element of its own, so "playback constrained to the selection" (mirroring `Audio`'s `trimmable` + `playTrimmedOnly` pair) is the caller's job: pair the reported `trimRange` with a `Video`/`Audio` ref's own playback controls, as shown in the new `Trimmable` story.

  The segment `option`s now live in their own inner `role="listbox"` layer rather than on the outer track element, so the trim handles (`role="slider"`) can sit alongside them without violating `listbox`'s ARIA-required-children rule. This is an internal DOM restructure only — no prop or behavior change for existing `segments`/`selectedId`/`onSegmentClick`/`onSeek` usage.

## 0.5.0

### Minor Changes

- 0fc595a: Add `SegmentTrack`, a horizontal duration-scaled track of disjoint labelled regions that doubles as a review queue — built from a real consumer component request (a same-speaker-detection review UI): a video's full duration mapped to a track, with an engine's candidate segments drawn on it as clickable, keyboard-navigable regions.

  Fully controlled: `segments` is `{ id, start, end, state, confidence? }[]`, with `state` one of `candidate` | `excluded` | `selected` | `accepted` | `rejected` — the consumer re-renders with updated `state` values to reflect any decision, the same "component stays dumb, consumer owns the decision" split `FileUpload`/`DataGrid` already draw. Clicking (or arrow-navigating to) a region fires `onSegmentClick(id)`; clicking the empty track fires `onSeek(time)`. An optional `waveform` prop renders pre-computed amplitude peaks as decorative background context, and `currentTime` renders a playhead marker.

  Not `Timeline` (an event log, not a duration-proportional axis) and not a `RangeSlider` composition (N independently-labelled, non-adjustable regions with per-region state, not one draggable min/max pair). Drag-to-resize a segment's boundaries is deliberately out of scope for this release.

- d78fc6c: Fix components shipping fully unstyled: no `--ds-*` CSS variable was ever defined anywhere in `dist`, through `0.4.0`, confirmed against a real consumer app. `dist/style.css` (component CSS) only ever _consumes_ `var(--ds-*)`; it never defined those variables, and `src/styles/variables.css` — the file that maps them from `@mellon-design/tokens-web` — was imported only by Storybook, never bundled into the library build.

  Adds a new build output, `dist/tokens.css`, generated by `scripts/build-tokens-css.mjs` as the last step of `pnpm build`, and exported as `@mellon-design/react/tokens.css`. It resolves every `--ds-*` variable from `@mellon-design/tokens-web` into a self-contained stylesheet. Consumers now import both explicitly:

  ```ts
  import '@mellon-design/react/styles.css'; // component CSS — consumes --ds-*
  import '@mellon-design/react/tokens.css'; // defines every --ds-* variable
  ```

  Kept as a separate, optional import rather than folded into `styles.css` or `src/index.ts` — deliberately, so a consumer who already wires up their own token layer from `@mellon-design/tokens-web` directly isn't forced to load this package's specific light/dark/high-contrast choices.

## 0.4.0

### Minor Changes

- df2089b: Fix `Video`/`Audio` to forward `ref` to their real `HTMLVideoElement`/`HTMLAudioElement`, matching this library's own "every component forwards ref" convention (both had been shipped without it). This unblocks anything needing the actual DOM node — most notably `AudioContext.createMediaElementSource`, which cannot work off a wrapper or a number. Both also gain `onTimeUpdate?: (currentTime: number) => void`, fired on every native `timeupdate`, for consumers who want a reactive readout rather than an imperative ref read.

  `FileUpload` gains `variant?: 'dropzone' | 'button'` (defaults to `'dropzone'`, unchanged). `variant="button"` renders a plain themed trigger over the same hidden `<input type="file">` — no drop target, no rendered file list — for a one-shot "open a file" action where the picked `File` goes straight into other state (e.g. an object URL handed to `Video`) rather than being tracked as an upload. Same `onFilesAdded`/`onReject`/`accept`/`maxSize` contract either way; only the chrome changes. `files` is now optional (defaults to `[]`), since the button variant never renders a list.

## 0.3.0

### Minor Changes

- 4fe58de: Ship Phase 19's `Video` and `Audio` — the design system's first media-playback components.

  `Video` wraps a plain `<video>` with fully custom, themed controls (native `controls` can't be styled with `--ds-*` tokens): play/pause, seek and volume (both reuse `Slider` directly rather than a hand-rolled thumb), mute, an optional captions (CC) toggle rendered only when `captions` WebVTT tracks are passed, and fullscreen. All playback state (`currentTime`, `duration`, `volume`, `muted`, `paused`) is read back off the element's own DOM events, so a browser-level gesture (a media key, an OS volume change) can't desync the UI from reality. Loading a **local file** is deliberately left to `FileUpload` — a consumer wires `onFilesAdded` to an object URL and hands it to `Video`'s `src`.

  `Audio` is a clip player with a real rendered waveform, not a flat scrubber. `computePeaks` (pure, unit-tested) downsamples decoded PCM channel data to per-bucket peak amplitudes; the actual decode (`AudioContext.decodeAudioData`) is feature-detected and resolves to `null` on any failure — no `AudioContext`, an unreachable `src`, an unsupported codec, CORS — falling back to flat placeholder bars rather than inventing a waveform, the same refusal `LineChart` already applies to a missing reading.

  The waveform track carries up to three independent `role="slider"` thumbs sharing one pointer-math helper: a "Seek" thumb (always present, doubling as the playhead) and, when `trimmable` is set, "Trim start"/"Trim end" thumbs using `RangeSlider`'s cross-clamped closer-thumb-wins shape. Each thumb owns its own `usePointerDrag` instance and isolates its own `onPointerDown` so grabbing a thumb doesn't also fire the track's click-to-seek handler for the same gesture.

  **Trim state is reporting-only.** `onTrimChange` fires with `{ start, end }` seconds; no audio is re-encoded inside this library — producing the actual trimmed file is the consumer's job, the same boundary `AIClient` draws around completions. `playTrimmedOnly` constrains playback to the trimmed window without touching the underlying file at all.

## 0.2.0

### Minor Changes

- fb25b60: Make the Kanban board AI-native: `KanbanBoard` gains `aiPrompt`, backed by `KanbanPromptBar`, `KanbanChangePreview`, `useKanbanCommands`, `kanbanSnapshot` and `parseKanbanResolution`.

  This is the library's first AI affordance that **changes structured state** instead of producing text. Everything shipped before it turns the model's `string` into prose (`aiExplain`), a text field's value (`aiRewrite`, `aiSearch`) or an answer about data (`aiTableQuery`); driving a board by prompt needs typed operations against identified entities, which is a genuinely new capability.

  **The vocabulary is ours, the transport is yours.** `KanbanCommand` and its validator live in the library; `resolveCommands` is consumer-owned — tool-calling, JSON mode, a server round-trip, whatever you already run. `AIClient` was deliberately not widened: 26 AI-enhanced components depend on that two-method contract, and structured output is a Kanban-local concern. Omit the resolver and the board falls back to `AIClient.complete` plus `parseKanbanResolution`, so every existing client keeps working.

  **Responses are classified by blast radius**, because handling them uniformly fails in both directions — it either turns "what's blocked?" into a scary confirmation dialog, or lets "tidy the backlog" rewrite forty cards before anyone sees them:

  - no commands → an answer: shown, announced, relevant cards highlighted, board untouched
  - one non-destructive command → applied immediately with an undo `Toast`
  - more than one command, or any `delete` → staged in `KanbanChangePreview` for per-item review

  Validation runs on **every** path, including your own `resolveCommands` — a model that hallucinated a card id is not more trustworthy for having come through someone else's transport. Invalid commands are dropped and shown with their reason rather than thrown or half-applied.

  Two behaviours are deliberate rather than incidental. Unparseable prose becomes a `message`, not an error: a model answering "what's blocked?" in plain English has done the right thing, and the failure mode of the alternative (the user sees an error and the board is untouched) is the safe direction anyway. And `@` in the prompt bar resolves a card to its **id** client-side via `useFloatingListPicker`, which removes the single hardest thing we'd otherwise ask a model to get right — two similar titles and a confident guess between them.

  `aiPrompt` renders nothing unless there's a way to resolve a prompt: an ancestor `AIProvider` **or** a `resolveCommands`. With neither, the board's markup is byte-identical to the non-AI rendering — there's a test asserting exactly that, and a Storybook story showing it. Note this widens the usual rule slightly: supplying a resolver is itself an explicit opt-in, so it enables the bar without a provider mounted.

  Undo uses `ToastContext` read directly rather than `useToast`, which throws outside its provider — an undo affordance must never be the reason a board can't mount. Without a `ToastProvider` the change still applies and is announced through the board's live region.

  The prompt payload is budgeted and deterministically truncated (`kanbanSnapshot`): every column always appears, since a column a model can't see is a destination it can't use, and cards are dropped from the end with the omitted count stated in the prompt.

  Also adds `highlighted` to `KanbanCard`, which pairs its ring with visually-hidden text so the annotation isn't carried by colour alone.

- fb25b60: Add `aiExplain` to the chart track — a plain-language reading of the plotted series.

  The affordance lives on `ChartContainer`, so `BarChart`, `LineChart` and `ChartSurface` all inherit it by mounting there rather than each wiring its own; the same reasoning that put the accessible table twin in the container. Opt-in via `aiExplain`, with `buildAIPrompt` to replace the prompt and `aiExplainLabel` to rename the trigger.

  It follows the existing AI conventions exactly: no vendor SDK, key or `fetch` in the library, one `useAIAction` instance per container, and — the load-bearing rule — nothing rendered at all unless an ancestor `AIProvider` is mounted, so the output is byte-identical to today's without one. Read-only like `Alert`'s explanation: there are no accept/reject actions, because a chart's data belongs to the caller and there is nothing to write back into.

  Two details specific to charts. The prompt is built from the `data` prop directly rather than by scraping the rendered DOM the way `Table` must, and the series is also forwarded on the `context` bag so a client can use the structured form. Values are stated through the chart's own `formatValue`, so the prompt reads in the same units as the axis, and a non-finite reading is described as `no data` rather than sent as `NaN` — the same refusal to invent a measurement that makes `LineChart` break its line at a gap.

  Exports `ChartAIProps` and `ChartExplainPromptOptions`.

- fb25b60: Add the first plotted charts: `BarChart` and `LineChart`, both single-series, built on `useChartScale` and `ChartContainer`, plus the shared chrome they compose — `ChartAxis` and `ChartGrid`.

  Both charts mount in `ChartContainer`, so the accessible table twin, caption and optional table toggle come for free; the SVG itself stays `aria-hidden`. Bars include zero in the domain by default and grow in both directions from an explicit zero line when the data goes negative. A non-finite value is dropped from the plot but kept in the table, and in `LineChart` it breaks the line into separate segments rather than being interpolated across.

  Series colour is still limited to one series by design — `variables.css` defines no categorical palette until the Foundation ships the per-theme roles.

  Also exports `resolveChartFrame` and `DEFAULT_CHART_MARGIN` from the chart-scale module, and fixes a `scrollable-region-focusable` accessibility violation in `ChartContainer`, where `Table`'s horizontal scroll container became a scrollable region with no focusable content once `VisuallyHidden` clamped the table twin to 1px.

- fb25b60: Canvas phase 5: the rest of the block catalogue, and a viewport pass.

  **New block kinds** — `code`, `table`, `link`, `checklist` and `chart`, joining
  sticky/text/image/shape/divider/embed/frame. All but one are delegation to
  components that already exist (`Code`, `Table`, `Link`, `ChartSurface`);
  `checklist` gets its own `CanvasChecklist` because it is the only face with
  state of its own, and a tick still travels as an `update` command through the
  reducer. Each kind is parsed from an AI response and named in the outline
  (a checklist reports its own progress there).

  **Navigation.** The wheel now pans freely in both axes, Shift pans sideways,
  and Ctrl/Cmd zooms about the pointer — bound as a native non-passive listener,
  since React's `onWheel` is passive and the page scrolled away underneath the
  gesture. The keyboard gained the whole viewport: arrows pan when nothing is
  selected (Ctrl/Cmd forces it regardless), `+`/`-` zoom, `0` resets, `1` zooms
  to fit, PageUp/PageDown jump. All of it works under `readOnly`, and zoom is
  announced as a percentage.

  **Look.** The painted grid is removed and the `showGrid` prop with it
  (**breaking**, though `grid` — snap spacing — is unrelated and unchanged). The
  surface is now the recessed neutral with block faces on the lighter surface, so
  blocks sit on the workspace instead of dissolving into it.

  **Fix:** a press on a control inside a block no longer starts a drag, and
  pointer capture is deferred until a drag actually begins. A captured pointer
  never delivers its click, which meant controls inside a block silently stopped
  responding.

- fb25b60: Add `Canvas` — an infinite, pannable, zoomable block workspace — with `StickyNote`, `CanvasShape`, `CanvasEmbed`, `CanvasFrame`, `CanvasBlock`, `CanvasConnector`, `CanvasOutline`, plus `useCanvasViewport`, `applyCanvasCommands` and the `canvasGeometry` helpers.

  This reopens a documented exclusion. `docs/COMPONENT_LIST.md` listed Canvas/Workspace as out of scope because it needed "a full canvas engine" — true of a `<canvas>` implementation, and not of this one. Blocks are absolutely-positioned **real DOM elements** inside a single transformed world div, so there's no engine: every existing component can be a block, `--ds-*` tokens and all three themes apply for free, and blocks stay focusable and present in the accessibility tree. A raster surface would have cost all four. **Freehand ink stays excluded** and is the one item the original reasoning got right — thousands of points per stroke is genuinely a raster problem.

  **Accessibility is the load-bearing design decision.** A canvas conveys meaning through position, which is exactly what a screen reader cannot perceive. So the spatial rendering is `aria-hidden` and `CanvasOutline` **is** the accessible content — the same split the chart track makes between an `aria-hidden` SVG and its table twin. The outline lists blocks in reading order (top-to-bottom, then left-to-right, with a row tolerance so two blocks side by side aren't read as one above the other) and states every connection as text. It is not a convenience view; without it the canvas has no accessible content at all.

  Keyboard reaches everything the pointer does: arrows nudge, Shift+arrows step further, **Alt+arrows resize** — so the eight drag handles need no keyboard equivalent and add no tab stops — Enter edits a note, Delete removes, Escape deselects, each announced through a live region.

  Every mutation — drag, resize, keyboard, and the AI commands coming in later phases — becomes a `CanvasCommand` through one pure reducer, so no two input paths can disagree about clamping or cascade rules. It validates sequentially and **drops-and-reports** rather than throwing: a `create` followed by a `connect` naming the block it just made both succeed, while a hallucinated id is a reported rejection instead of a corrupted scene. Deleting a block takes its connectors with it; a resize below the minimum is _clamped_ rather than rejected, because a resize drag emits sub-minimum values continuously and rejecting each would stutter instead of stopping.

  Connector routing works from the blocks' stored canvas rects, never from measured DOM — which is what makes the whole geometry layer unit-testable despite jsdom having no layout engine, exactly where the bugs live. A connector whose endpoint has gone renders nothing rather than throwing mid-render.

  `CanvasEmbed` never uses `dangerouslySetInnerHTML`. Content renders in an iframe with `allow-scripts` but deliberately **without** `allow-same-origin` — granting both is equivalent to no sandbox at all, since the frame could then reach the parent document and strip its own sandbox attribute. There's a test asserting that pairing can't be reintroduced.

  Note and shape `tone` is one of the five semantic roles rather than a free colour, and is decoration only — the block's own text carries its meaning. A wider whiteboard palette is blocked on the same Foundation gap as chart series colour, and inventing one here would break the same contract.

  Known limits, stated rather than discovered later: DOM blocks degrade past roughly 500 on screen (viewport culling is supported by the coordinate model but not built), and this adds to an already-failing `pnpm size` budget.

- fb25b60: Canvas phase 3: `aiCluster` affinity mapping.

  `Canvas` gains `aiCluster`, which adds a "Group by theme" trigger: the notes
  are read, grouped by meaning, and each group is framed with its members laid
  out inside. Like `aiPrompt` it renders nothing without an `AIProvider` or a
  `resolveClusters` of your own, and it always stages the result for review —
  clustering rearranges work the user arranged themselves.

  The model is asked only which blocks belong together, never where to put them.
  Placement is the new pure `clusterCommands` (`src/utilities/canvasClusters.ts`),
  which lays out a grid per frame clear of everything that isn't moving and never
  resizes a block. Groups are validated like commands are: an unknown id, or a
  block claimed by two groups, is dropped and reported.

  Also exported: `normalizeCanvasClusters`, `parseCanvasClusterResolution`,
  `buildCanvasClusterPrompt`, `clusterCandidates`/`isClusterCandidate`,
  `DEFAULT_CLUSTER_LAYOUT`, and `useCanvasCommands`' new `cluster`/
  `clusterAvailable`.

- fb25b60: Make the canvas AI-native: `Canvas` gains `aiPrompt` and `aiRewrite`, backed by `CanvasPromptBar`, `CanvasChangePreview`, `useCanvasCommands`, `canvasSnapshot` and `parseCanvasResolution`.

  The pipeline is deliberately the same shape the Kanban board already proved — resolve, validate, classify by blast radius, apply or stage — because the policy is the same policy. The vocabulary (`CanvasCommand`) and its validator belong to the library; the transport does not. `resolveCommands` is consumer-owned, and `AIClient` was again left alone rather than widened.

  **One line moved versus the board.** A lone `create` applies immediately: adding a block is additive and trivially undone, and making "add a note" open a review panel would make the feature not worth using. Anything that _changes or removes_ existing content — including a lone `move` — is staged. Deletes always are.

  Two canvas-specific details in the prompt payload. **Geometry is content here**, not decoration: "put it next to the login note" is only answerable from coordinates, so every block carries its rect. And the scene's occupied bounds ride along, because a model given no placement guidance will cheerfully create ten blocks at `0,0`. The snapshot serializes in reading order, so a truncated scene keeps the blocks a person would have mentioned first.

  `CanvasChangePreview` describes commands against the scene **plus the blocks the batch creates**. Without that, "add two notes and connect them" read as `Connect n1 to n2` — naming by id in exactly the case a human most needs a real name, since those blocks don't exist yet.

  **A phase-1 accessibility decision is corrected here.** The canvas previously made the whole world `aria-hidden`, treating `CanvasOutline` as its table twin. That was the wrong analogy: a chart's SVG is paths with no text, but canvas blocks hold real content _and real controls_. Once notes gained a "Rewrite with AI" trigger, that design put focusable buttons inside an `aria-hidden` subtree — a violation, not a trade-off, and one no earlier test caught because none enabled `aiRewrite` with a provider.

  So blocks are now labelled groups in the accessibility tree, only the connector SVG (pure geometry, whose meaning the outline states as text) stays hidden, and `CanvasOutline` is documented as a navigation aid over the blocks rather than a substitute for them. A `frame` block defers its labelling to `CanvasFrame` so the same name isn't announced twice around nested groups. There's a regression test asserting the per-note trigger stays reachable.

  `aiPrompt` renders nothing unless there's an `AIProvider` or a `resolveCommands`; `aiRewrite` needs a provider specifically, since it calls `complete` directly. With neither, markup is byte-identical to the non-AI canvas — asserted by a test and shown in a story. Undo reads `ToastContext` directly rather than `useToast`, which throws outside its provider.

- fb25b60: Complete the chart chrome and fold `ChartSurface` into it.

  Adds `ChartTooltip` and `ChartDataLabel`, and wires both into `BarChart` and `LineChart`. Hovering reads out the value under the pointer (`showTooltip`, on by default; `renderTooltip` replaces the body), and `showDataLabels` prints values next to their marks (off by default — labels don't self-avoid). The tooltip anchors in percentages of the plot box rather than pixels, so it tracks the scaling SVG without measuring anything. Hit areas span the whole category slot including the gutter, so a pointer between two bars still picks a side. `LineChart` draws a crosshair; `BarChart` deliberately doesn't, since a bar already spans baseline-to-value — it outlines the hovered bar instead.

  `ChartDataLabel` only sits outside its mark. In-bar labels need the `-on` contrast roles the Foundation hasn't shipped, so that placement is absent rather than approximated.

  **Breaking — `ChartSurface`** is now a thin preset over `BarChart`/`LineChart` instead of a parallel implementation with its own scale math and its own copy of the accessible-table pattern:

  - Its root element is a `<figure>`, not a `<div>`; `ref` is now `HTMLElement` and the passthrough props are figure props.
  - The table twin now uses row headers and is labelled by the caption, so a category cell is a `rowheader` rather than a `cell`.
  - It gains a value axis, gridlines, nice-rounded ticks, a zero-based baseline and the hover readout, and accepts the charts' own options.
  - `ChartDataPoint` is now a deprecated alias of `ChartDatum`.

  Also adds `slotWidth` to `BandScale` — the full slot including its gutter, which is the width a pointer hit area needs.

- fb25b60: Rework the Kanban board's drag interaction, add per-card actions, and refine the visual design.

  **Drag now shows where the card will land.** Previously the card ghosted in place and only the target column's border changed, which told you _which_ column you were over but never _where_ in it — the difference between dropping a card and guessing. The dragged card now tracks the cursor, and a line marks the exact insertion point.

  Two details that make this correct rather than merely animated. The dragged card keeps its DOM position and moves by `transform`, so its original slot stays open as a placeholder instead of the card jumping to a new position the instant the drag begins. And it is **excluded from hit-testing**: once it follows the pointer its measured rect is wherever the cursor is, not where it sits in the list. Excluding it also happens to produce exactly the index the reducer wants, since `move` means "position once the card has left its old slot" — so the indicator appears where the card actually lands even when it moves downward within its own column, which is the case an off-by-one would break.

  **Cards now carry an overflow menu** (`cardMenu`, on by default) listing every other column plus `Delete`. This is the only _discoverable_ pointer affordance on the board: dragging advertises nothing, and on touch it's behind a long press. Every item runs through the same reducer and `onCommand` as a drag, and the board is controlled, so a consumer sees and can refuse each change. `hideCardDelete` drops the destructive item, `cardMenu={false}` removes the menu, and `cardActions` adds your own controls.

  Two interaction guards come with it: a press on an action doesn't start a drag, and the board no longer intercepts keystrokes aimed at a control inside a card — without that, Space on the menu button would lift the card instead of opening the menu.

  Visual refinement throughout — card padding and hover elevation, a pill for the column count, a dashed empty state, a warning-toned WIP overflow — entirely from `--ds-*` tokens. The dragged card now reads through elevation and border rather than the flat `opacity: 0.6` it used before, which removes this component's only dependence on the unmapped opacity scale (`docs/TOKEN_AUDIT.md` B2). Exactly one raw value survives in the Kanban CSS, commented: the column's `min-width`, component-intrinsic geometry with no matching token since `variables.css` maps no sizing scale. The drag threshold is likewise a bare number in TS — it's a property of human hands, not of the design language.

  `KanbanCard` gains an `actions` slot, positioned outside the flow so a custom `renderCard` face keeps its actions without laying them out itself.

- fb25b60: Add the Kanban board — `KanbanBoard`, `KanbanColumn` and `KanbanCard`, plus the pure `applyKanbanCommands` reducer behind them.

  This is the first phase of an AI-native board: the board itself, with **no AI at all**. That ordering is deliberate rather than incidental. Every AI affordance in this library is inert whenever no `AIProvider` is mounted, so a prompt bar can never be the accessibility story for a board — the board has to be complete on its own first, and this phase is what makes that true by construction.

  The consumer owns the data (`KanbanBoardData`: `columns` plus a normalized `cards` record) and the board emits `KanbanCommand`s rather than mutating anything, the same "component stays dumb, consumer owns state" split as `DataGrid`/`FileUpload`. Card order lives on the column's `cardIds`, which makes a move a list splice.

  Both move paths — pointer drag and keyboard — go through the same pure reducer, so they can't drift apart on index semantics. Keyboard moves are first-class: Space/Enter picks a card up, arrows move it, Space/Enter drops it, Escape puts it back exactly where it started, and every step is announced through a live region. Moving a card across columns re-parents its element and would otherwise drop focus to `<body>`, stranding the user after one arrow press, so the lifted card is re-focused after each applied move.

  `applyKanbanCommands` validates as it goes, against the board as of that point in the sequence — a `create` followed by a `move` of the card it just created both succeed, while a command naming a card that never existed is dropped and reported rather than throwing or half-mutating the board. That behaviour exists for the AI layer that comes next: a single hallucinated id must not be able to corrupt a board.

  Two smaller decisions worth knowing. `wipLimit` is advisory — an over-limit column says so in words but the drop is never blocked, because refusing it would strand a card mid-move with no way to finish. And a card's `status` renders its label as visible text through `Badge` rather than as a bare coloured dot, so status colour is never the sole carrier of meaning; `statusLabels` overrides the wording.

  Drag physics remain unverifiable in jsdom (no layout engine, no pointer capture), so the drag path is covered by `pnpm test:storybook` while the reducer and the whole keyboard contract are unit-tested.

  Exports `KanbanBoardData`, `KanbanColumnData`, `KanbanCommand`, `KanbanCardData`, `KanbanCardStatus`, `KanbanAssignee`, `KanbanApplyResult`, `KanbanRejectedCommand`, `applyKanbanCommands`, `validateKanbanCommands`, `findColumnOfCard` and `isOverWipLimit`.

- fb25b60: Canvas phase 4: `aiDiagram`, plus two frame rendering fixes.

  `Canvas` gains `aiDiagram`, a bar you describe a flow into — it's drawn as
  shapes and connectors. The model returns a graph of nodes and edges with no
  coordinates; the new `src/utilities/canvasDiagram.ts` owns everything spatial:
  `breakDiagramCycles` (so a retry loop can't invert the reading order),
  `rankDiagramNodes`, `layoutCanvasDiagram`, `diagramCommands`. A node's `role`
  (start, decision, process…) maps onto the shape vocabulary in the library.

  Unlike clustering, a diagram is applied immediately with an undo toast: it adds
  content and touches nothing that already existed. That claim is checked by the
  new `isPurelyAdditive` rather than assumed, and a batch failing it falls back to
  the review panel.

  Two rendering fixes to `Canvas`/`CanvasFrame`, both visible on any framed scene:

  - Connectors now paint **above frames** and below other blocks. The connector
    layer previously rendered under every block, so a frame — a full-size
    backdrop — hid every edge inside it.
  - A frame is now an **unfilled boundary** (dashed edge plus title). Its
    `surface-secondary` fill was the same colour a clipped `CanvasShape` uses, so
    a diamond placed on a frame was invisible.

  Also exported: `normalizeCanvasDiagram`, `parseCanvasDiagramResolution`,
  `buildCanvasDiagramPrompt`, `diagramNodeShape`, `DEFAULT_DIAGRAM_LAYOUT`, and
  `useCanvasCommands`' new `diagram`/`diagramAvailable`.
