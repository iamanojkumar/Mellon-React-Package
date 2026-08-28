# Component Reference

Brief docs for every component exported from `@mellon-design/react`. One row
per component: what it's for, and the props that aren't obvious. Full prop
types live in each component's own `.tsx`; behavioral rationale lives in
`docs/SPEC.md`. For which components exist and why, see
`docs/COMPONENT_LIST.md`.

## Conventions that apply everywhere

- **Polymorphic** components accept `as` to change the rendered element and
  forward the matching element's props (`<Button as="a" href="…">`).
- **Controlled/uncontrolled**: anything stateful takes `value`/`defaultValue`
  (or `open`/`defaultOpen`, `checked`/`defaultChecked`) plus a change handler.
  Pass the controlled prop to own the state, the `default*` one to let the
  component own it.
- **Spacing props** (`p px py pt pr pb pl m mx my mt mr mb ml`) are available
  on layout primitives. Values are `SpaceValue`: `'none' | 'xs' | 'sm' | 'md' |
'lg' | 'xl' | '2xl'`, a raw CSS length string, or a number.
- **Variants** render as `data-*` attributes, not modifier classes.
- **AI props** (`aiExplain`, `aiRewrite`, `aiSuggest`, …) are opt-in and inert
  unless an ancestor `AIProvider` is mounted — output is byte-identical to the
  non-AI rendering otherwise. Each pairs with a `buildAIPrompt` override and an
  `*Label` for the trigger's accessible name. See [AI](#ai) below.
- Every component forwards `ref` and merges `className`, except `Portal`,
  which renders no element of its own.
- **Styling needs two CSS imports**: `@mellon-design/react/styles.css`
  (component CSS) and `@mellon-design/react/tokens.css` (defines every
  `--ds-*` variable the first one consumes). Omitting the second renders
  everything unstyled — nothing defines the variables on its own.

---

## Foundations

| Component        | What it does                                         | Key props                                                                                                   |
| ---------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `Box`            | The unstyled primitive — a `div` with spacing props. | all `SpacingProps`, `as`                                                                                    |
| `Flex`           | Flexbox container.                                   | `direction` `align` `justify` `wrap` `gap`                                                                  |
| `Grid`           | CSS Grid container.                                  | `columns` `rows` (number of equal tracks _or_ a raw template string), `gap` `columnGap` `rowGap` `autoFlow` |
| `Stack`          | Vertical flex stack.                                 | `gap` `align`                                                                                               |
| `Inline`         | Horizontal flex row that wraps by default.           | `gap` `align` `wrap` (default `true`)                                                                       |
| `Spacer`         | Flexible gap; `flex: 1` unless sized.                | `size`                                                                                                      |
| `Container`      | Centered max-width page wrapper.                     | `maxWidth` (`sm`–`xl`, `full`), `paddingX`                                                                  |
| `Center`         | Centers its children both axes.                      | `inline`                                                                                                    |
| `Divider`        | Rule between content.                                | `orientation`                                                                                               |
| `AspectRatio`    | Locks children to a ratio.                           | `ratio` (e.g. `16 / 9`, default `1`)                                                                        |
| `VisuallyHidden` | Screen-reader-only text.                             | `as`                                                                                                        |

## Typography

All accept `color` (`primary` `secondary` `inverse` `disabled` `brand`
`success` `warning` `danger`), and most accept `size` (`xs`–`xl`),
`weight` (`regular` `medium` `bold`), `align` (`start` `center` `end`
`justify`).

| Component    | What it does                                                    | Key props                                                                         |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Text`       | Inline text primitive; every other type component builds on it. | `size` `weight` `color` `align` `truncate`                                        |
| `Heading`    | Semantic heading.                                               | `level` (**required**, 1–6 — picks both tag and default size), `size` to override |
| `Display`    | Oversized display type for hero copy.                           | `size` (`sm` `md` `lg`)                                                           |
| `Label`      | Form label.                                                     | `required` (asterisk; `Field` renders its own)                                    |
| `Paragraph`  | Body paragraph.                                                 | `aiSummarize`                                                                     |
| `Caption`    | Small secondary text.                                           | `color` `align`                                                                   |
| `Code`       | Inline snippet, or a scrollable block.                          | `block`, `aiExplain`                                                              |
| `Link`       | Anchor styled as a link.                                        | `size` `weight` `color`                                                           |
| `Blockquote` | Pull quote.                                                     | `aiExplain`                                                                       |
| `List`       | `<ul>`, or `<ol>` via `ordered`.                                | `ordered` `spacing` `unstyled`                                                    |
| `ListItem`   | List row.                                                       | `size` `color`                                                                    |

## Buttons

| Component              | What it does                                      | Key props                                                                                                                                                                                                                                       |
| ---------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`               | Standard button; polymorphic.                     | `variant` (`primary` `secondary` `ghost` `danger`), `size` (`sm` `md` `lg`), `loading` (spinner + `aria-busy` + disables), `disabled`, `icon` (decorative `ReactNode`, hidden while `loading`), `iconPosition` (`start` `end`, default `start`) |
| `IconButton`           | Icon-only button.                                 | `aria-label` **required**, `shape` (`square` `circle`), plus `Button`'s props                                                                                                                                                                   |
| `ButtonGroup`          | Joins adjacent buttons into one control.          | `orientation`                                                                                                                                                                                                                                   |
| `ToggleButton`         | Two-state pressed button.                         | `pressed`/`defaultPressed`/`onPressedChange`; pressed look is always the brand highlight regardless of `variant`                                                                                                                                |
| `SplitButton`          | Primary action + attached menu of secondary ones. | `onClick`, `menu` (`Dropdown.Item`s), `menuLabel` `groupLabel`                                                                                                                                                                                  |
| `FloatingActionButton` | Prominent circular action.                        | `aria-label` **required**, `fixed` (pins bottom-right), `size` (`md` `lg`)                                                                                                                                                                      |

> `disabled` only becomes a real DOM attribute on a native `<button>`. With
> `as="a"` (or any non-button), you get `aria-disabled` + a CSS treatment
> instead, since HTML has no `disabled` for those elements.

## Inputs

| Component        | What it does                                                                                                                                   | Key props                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Input`          | Text input.                                                                                                                                    | `size` `invalid`, `aiAutocomplete`, `onAIOpenChange`/`onAIAccept`/`onAIReject` (observe the AI flow — an accepted suggestion is otherwise indistinguishable from a keystroke)                                                                                                                                                                                                                                                                                                    |
| `TextArea`       | Multi-line text.                                                                                                                               | `size` `invalid`, `aiRewrite`, `onAIOpenChange`/`onAIAccept`/`onAIReject`                                                                                                                                                                                                                                                                                                                                                                                                        |
| `PasswordField`  | Input with a show/hide toggle.                                                                                                                 | `showLabel` `hideLabel`                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `SearchField`    | Input with a clear button.                                                                                                                     | `clearLabel`, `aiSearch`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `NumberField`    | `Input` with `type="number"`.                                                                                                                  | `InputProps` minus `type`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `EmailField`     | `Input` with `type="email"`.                                                                                                                   | `InputProps` minus `type`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `PhoneField`     | Phone input with a country-code selector.                                                                                                      | `countryCode`/`defaultCountryCode` (ISO alpha-2), `hideCountrySelect`. `value` is always just the national number, never the dial code                                                                                                                                                                                                                                                                                                                                           |
| `OTPInput`       | Segmented one-time-code entry.                                                                                                                 | `length` (default 6), `onComplete`, `characterType` (`numeric` `alphanumeric`), `mask`                                                                                                                                                                                                                                                                                                                                                                                           |
| `PinInput`       | `OTPInput` without masking.                                                                                                                    | `OTPInputProps` minus `mask`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `Select`         | Single-choice listbox.                                                                                                                         | `options`, `placeholder` `size` `invalid` `required`, `aiSuggest`                                                                                                                                                                                                                                                                                                                                                                                                                |
| `MultiSelect`    | Multi-choice listbox with a summarizing trigger.                                                                                               | `options`, `value: string[]`, `summarizeAfter` (switches to "N selected", default 2), `aiSuggest`                                                                                                                                                                                                                                                                                                                                                                                |
| `Combobox`       | Text input filtering a list.                                                                                                                   | `options`, `filterOptions`, `allowFreeText` (default `false` — typing without selecting reverts on blur), `noResultsLabel`, `aiSearch`                                                                                                                                                                                                                                                                                                                                           |
| `Autocomplete`   | `Combobox` locked to `allowFreeText: true` — the list is suggestions, not a constraint.                                                        | `ComboboxProps` minus `allowFreeText`                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `Checkbox`       | Checkbox with optional inline label.                                                                                                           | `checked`/`onCheckedChange`, `indeterminate` (visual dash + `aria-checked="mixed"`; doesn't change `checked`), `invalid`, `label`                                                                                                                                                                                                                                                                                                                                                |
| `RadioGroup`     | Radio set. Compound: `RadioGroup.Radio`.                                                                                                       | `value`/`onValueChange`, `orientation`, `disabled`                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `Switch`         | On/off toggle.                                                                                                                                 | `checked`/`onCheckedChange`, `label`, `invalid`                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `Slider`         | Single-value slider.                                                                                                                           | `min` `max` `step` `orientation` `size`, `formatValue`, `showValue` (`always` `drag` `off`)                                                                                                                                                                                                                                                                                                                                                                                      |
| `RangeSlider`    | Two-thumb range.                                                                                                                               | `value: [number, number]`, `startLabel` `endLabel`, plus `Slider`'s props                                                                                                                                                                                                                                                                                                                                                                                                        |
| `Rating`         | Star rating.                                                                                                                                   | `max` (default 5), `allowHalf`, `formatValue` (drives `aria-valuetext`)                                                                                                                                                                                                                                                                                                                                                                                                          |
| `ColorPicker`    | Hex color picker with preset swatches.                                                                                                         | `value` (hex string), `presets`, `aiSuggest` (invalid hex responses are ignored)                                                                                                                                                                                                                                                                                                                                                                                                 |
| `DatePicker`     | Calendar in a popover.                                                                                                                         | `selectionMode` (`single` `range` — range uses `rangeValue`/`onRangeChange`), `min` `max`, `formatDate`, `aiParse` (natural-language dates; single mode only)                                                                                                                                                                                                                                                                                                                    |
| `TimePicker`     | Time `Select` built from a step range.                                                                                                         | `step` (minutes, default 30), `min` `max` (`"HH:MM"`), `use12Hour` (display only — value is always 24-hour)                                                                                                                                                                                                                                                                                                                                                                      |
| `FileUpload`     | Drop zone + file list (`variant="button"` for a plain one-shot trigger with no dropzone/list). Presentation only: it owns no upload transport. | `files` `onFilesAdded` `onRemove` `onReject`, `accept` `multiple` `maxSize` (bytes), `variant` (`dropzone` default, `button`), `triggerLabel` (button variant only), `aiDescribe`                                                                                                                                                                                                                                                                                                |
| `RichTextEditor` | `contentEditable` editor over an HTML string.                                                                                                  | `value`/`defaultValue`/`onChange` (HTML strings), `readOnly` `invalid`, `variant` (`'boxed'` default \| `'plain'` — drops the toolbar's/editable surface's own border and background, for embedding inside a host that's already the box), `showToolbar` (default `true`), `minHeight` (overrides the editable surface's default `8em`), `aiRewrite` (trigger sits at the end of the toolbar row; the suggestion is applied as HTML), `onAIOpenChange`/`onAIAccept`/`onAIReject` |

## Form

| Component      | What it does                                                             | Key props                                                                                                                             |
| -------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Field`        | Wraps one control with label, helper/error text, and the id/aria wiring. | `label` **required**, `helperText`, `errorMessage` (its presence implies `invalid`, and replaces `helperText`), `required` `disabled` |
| `Fieldset`     | Native `<fieldset>` with a legend.                                       | `legend`                                                                                                                              |
| `HelperText`   | Standalone helper text.                                                  | `as`                                                                                                                                  |
| `ErrorMessage` | Standalone error text.                                                   | `aiExplain`                                                                                                                           |
| `FormGroup`    | Vertical stack of fields.                                                | `gap` (default `md`)                                                                                                                  |
| `FormSection`  | Titled/described form section.                                           | `title` **required**, `description`                                                                                                   |

## Navigation

| Component        | What it does                                                  | Key props                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Navbar`         | Top app bar. Compound: `.Brand` `.Content` `.Actions`.        | `sticky`                                                                                                                                                               |
| `Sidebar`        | Side nav. Compound: `.Item` `.Group`.                         | `asDrawer` (renders as a `Drawer` overlay — pass this from your own breakpoint logic; the library has no media-query hook), `open`/`onOpenChange` when `asDrawer`      |
| `Breadcrumb`     | Trail of ancestors. Compound: `.Item`.                        | `separator`; `.Item`'s `current` renders a non-interactive `<span aria-current="page">`; `.Item as="button"` is fully styled (for router-driven trails with no `href`) |
| `Tabs`           | Tab set. Compound: `.List` `.Tab` `.Panel`.                   | `value`/`defaultValue` — there is no implicit "first tab", pass one                                                                                                    |
| `Pagination`     | Page number strip.                                            | `page` (1-indexed) `totalPages`, `siblingCount` `boundaryCount`                                                                                                        |
| `Menu`           | Menu surface. Compound: `Menu.Item` (`onSelect`, `disabled`). | `aiSuggest`                                                                                                                                                            |
| `Dropdown`       | Trigger + menu. Compound: `.Trigger` `.Menu` `.Item`.         | `open`/`onOpenChange`, `.Menu`'s `placement` and `aiSuggest`                                                                                                           |
| `ContextMenu`    | Right-click menu over a region.                               | `menu` (`Menu.Item`s — each `onSelect` is auto-wrapped to close), `menuLabel`, `aiSuggest`                                                                             |
| `CommandPalette` | ⌘K palette.                                                   | `items` or `groups`, `filterItems`, `hotkey` (Cmd/Ctrl+K listener, default `true`), `emptyLabel`, `aiSearch`                                                           |
| `NavigationRail` | Compact vertical icon rail. Compound: `.Item`.                | `.Item`: `active` `icon` (decorative) `badge`                                                                                                                          |
| `TreeView`       | Expandable tree.                                              | `nodes`, `expandedIds` `selectedId` (+ `default*`/`on*Change`), `aiSearch`                                                                                             |

## Data display

| Component      | What it does                                                                                                                                               | Key props                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Avatar`       | User image with initials fallback.                                                                                                                         | `src` `name` (drives initials and the alt fallback), `size` (`xs`–`xl`), `shape`, `color` (decorative tint on the initials fallback), `colorFrom` (derives a stable `color` from a key)                                        |
| `AvatarGroup`  | Overlapping avatars with a "+N" overflow.                                                                                                                  | `max`, `size` (applied to every child)                                                                                                                                                                                         |
| `Badge`        | Small status/count marker.                                                                                                                                 | `color` (`neutral` `brand` `success` `warning` `danger`), `variant` (`solid` `subtle`), `icon` — status colors get an automatic icon + hidden status word; pass `icon={false}` **only** when the text already names the status |
| `Chip`         | Removable token.                                                                                                                                           | `onRemove` (shows the ×), `removeLabel`, `disabled`                                                                                                                                                                            |
| `Tag`          | Label token; same color/icon rules as `Badge`.                                                                                                             | `color` `icon`                                                                                                                                                                                                                 |
| `Card`         | Content surface.                                                                                                                                           | `variant` (`elevated` `outlined`), `elevation` (elevated only), `padding`, `aiExplain`                                                                                                                                         |
| `Panel`        | Persistent, non-modal container docked at a viewport edge — stays open while the user keeps interacting with whatever it's docked beside, unlike `Drawer`. | `dock` (`start` `end`), `header` `footer` (pinned rows around a scrollable body)                                                                                                                                               |
| `Table`        | Semantic table. Compound: `.Head` `.Body` `.Row` `.HeaderCell` `.Cell`.                                                                                    | `aiTableQuery` (prompt is built from rendered text, since `Table` is children-driven)                                                                                                                                          |
| `DataGrid`     | Sortable, selectable data table.                                                                                                                           | `columns` `data` `getRowId` **required**, `sort`/`onSortChange`, `selectable`/`selectedRowIds`, `caption` `emptyState`, `aiTableQuery` `aiRowExplain`                                                                          |
| `Accordion`    | Disclosure set. Compound: `.Item` `.Trigger` `.Content`.                                                                                                   | `type` (`single` default / `multiple` — each mode has its own value props), `collapsible`, `headingLevel` (default 3), `.Content`'s `aiSummarize`                                                                              |
| `Timeline`     | Chronological event list. Compound: `.Item`.                                                                                                               | `orientation`; `.Item`: `time` `title` `icon` `color`; root `aiSummarize`                                                                                                                                                      |
| `Calendar`     | Month grid.                                                                                                                                                | `selectionMode` (`single` `multiple` `range` `none`), `min` `max`, `dayIndicator` (per-day marker color), `aiQuery`                                                                                                            |
| `Statistic`    | Metric with trend.                                                                                                                                         | `label` `value` **required**, `trend` (`up` `down` `neutral`), `trendValue`, `aiExplain`                                                                                                                                       |
| `EmptyState`   | Empty-list placeholder.                                                                                                                                    | `icon` `title` **required** `description` `action`                                                                                                                                                                             |
| `KeyValueList` | `<dl>` of label/value pairs.                                                                                                                               | `items`, `aiExplain`                                                                                                                                                                                                           |

## Feedback

| Component          | What it does                                                                                                                                          | Key props                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Alert`            | Inline message.                                                                                                                                       | `variant` (`info` `success` `warning` `danger`), `title`, `onDismiss` (shows the ×), `aiExplain`                                             |
| `Banner`           | Full-width page-level message; same variants as `Alert`.                                                                                              | `variant` `onDismiss` `aiExplain`                                                                                                            |
| `Toast`            | Transient notification. Not rendered directly — mount `ToastProvider` and call `useToast().toast({ title, description, variant, duration, action })`. | Provider: `position` (default `bottom-right`), `limit` (default 5), `defaultDuration` (default 5000ms)                                       |
| `Progress`         | Determinate/indeterminate bar.                                                                                                                        | `value` (omit for indeterminate), `max` `size` `label`                                                                                       |
| `CircularProgress` | Ring version of the above.                                                                                                                            | `value` `max` `size` `label`                                                                                                                 |
| `Skeleton`         | Loading placeholder.                                                                                                                                  | `variant` (`text` `circular` `rectangular`), `width` `height`                                                                                |
| `Spinner`          | Loading spinner.                                                                                                                                      | `size`, `label` (default "Loading")                                                                                                          |
| `LoadingOverlay`   | Blocking overlay + spinner.                                                                                                                           | `fullScreen` (default `true`, portalled to the viewport; `false` fills the nearest positioned ancestor — which you must set), `label` `size` |

## Overlays

| Component   | What it does                                                     | Key props                                                                                                                                                                   |
| ----------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dialog`    | Modal. Compound: `.Header` `.Body` `.Footer`.                    | `open`/`onOpenChange`, `title` (renders an `<h2>` and wires `aria-labelledby`) _or_ `aria-label` with a custom `.Header`, `size` (`sm` `md` `lg` `full`), `showCloseButton` |
| `Drawer`    | Edge panel; same parts as `Dialog`.                              | `placement` (`left` `right` `top` `bottom` — `bottom` adds a swipe-to-dismiss grabber, covering both Bottom Sheet and Action Sheet), `size` `title`                         |
| `Popover`   | Low-level anchored surface. Compound: `.Trigger` `.Content`.     | `triggerMode` (`click` default, `hover`), `closeDelay`; `.Content`'s `placement` and `role` (**no default** — set the right one for your usage)                             |
| `Tooltip`   | Hover/focus text on a single trigger.                            | `content` **required**, `children` must be a single element (it's cloned to attach handlers, a ref, and `aria-describedby`), `placement` `closeDelay`                       |
| `HoverCard` | `Popover` locked to hover mode. Compound: `.Trigger` `.Content`. | `PopoverProps` minus `triggerMode`                                                                                                                                          |

## Media

| Component      | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Key props                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Image`        | Image with fit/ratio handling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | `alt` **required** (pass `alt=""` explicitly for decorative), `fit` (`cover` `contain` `fill`), `ratio` `rounded`, `aiDescribe`                                                                                                                                                                                                                                                                                                                       |
| `Figure`       | `<figure>` + `<figcaption>`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `caption`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `Carousel`     | Slideshow; each child is a slide.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `index`/`onIndexChange`, `autoPlay` `autoPlayInterval` (ignored — starts paused — under `prefers-reduced-motion`), `loop` `showControls` `showIndicators`                                                                                                                                                                                                                                                                                             |
| `Video`        | `<video>` with custom themed controls (play/pause, seek, volume, captions, fullscreen). `ref` forwards to the real `HTMLVideoElement` (e.g. for `AudioContext.createMediaElementSource`).                                                                                                                                                                                                                                                                                                                                                                                                                         | `src` **required**, `poster`, `captions` (WebVTT tracks — shows a CC toggle when present), `autoPlay` (always starts muted), `loop` `defaultMuted` `defaultVolume`, `onPlay`/`onPause`/`onEnded`/`onTimeUpdate`                                                                                                                                                                                                                                       |
| `Audio`        | Audio clip player with a real rendered waveform. `ref` forwards to the real `HTMLAudioElement`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | `src` **required**, `trimmable` (adds draggable "Trim start"/"Trim end" handles), `trimRange`/`defaultTrimRange`/`onTrimChange` (`{ start, end }` seconds — reporting only, no re-encoding), `playTrimmedOnly`, `trimStep`, `waveformBars`, `loop` `defaultVolume`, `onPlay`/`onPause`/`onEnded`/`onTimeUpdate`                                                                                                                                       |
| `SegmentTrack` | Horizontal, duration-scaled track of disjoint labelled regions — doubles as a review queue (clicking/arrow-navigating a region reports its id; the caller decides what "selecting" it means, e.g. seeking a `Video`/`Audio` ref and loading a review panel). Fully controlled: the caller re-renders `segments` with updated `state` to reflect any decision. `trimmable` adds a second, independent continuous-range selection (draggable "Trim start"/"Trim end" handles, same shape as `Audio`'s own `trimmable`) — reporting-only, since this component has no media element to constrain playback on itself. | `duration` **required** (seconds), `segments` **required** (`{ id, start, end, state, confidence? }[]`, `state` one of `candidate`/`excluded`/`selected`/`accepted`/`rejected`), `currentTime` (playhead), `waveform` (optional pre-computed peaks, purely decorative), `selectedId`, `onSegmentClick`, `onSeek` (fires on empty-track click/drag), `trimmable`, `trimRange`/`defaultTrimRange`/`onTrimChange` (`{ start, end }` seconds), `trimStep` |

## Charts

Every chart renders an `aria-hidden` SVG plus a **table twin** carrying the
real accessible content, so `label` is required — it names both. The `width`/
`height` props are viewBox units (aspect ratio and relative stroke/label
weight), not a pixel size; the plot scales to its container. Chart color
requirements are in `docs/CHART_TOKEN_REQUIREMENTS.md`.

| Component        | What it does                                                                                       | Key props                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BarChart`       | Categorical bars.                                                                                  | `data` `label` **required**, `includeZero` (default `true` — keep it; a clipped baseline is how bar charts mislead), `bandPadding` `tickCount` `margin`, `showGrid` `showTooltip` `showDataLabels`, `formatValue` `renderTooltip`, `tableToggle`, `aiExplain` |
| `LineChart`      | Trend line.                                                                                        | Same as `BarChart` plus `showMarkers`. `includeZero: false` is legitimate here — a line encodes change by slope — but label it                                                                                                                                |
| `ChartSurface`   | Chat-sized preset wrapping `BarChart`/`LineChart`.                                                 | `type` (`bar` `line`), `data` `label`, `height` (default 200)                                                                                                                                                                                                 |
| `ChartContainer` | The `<figure>` shell: caption, description, table twin, AI trigger. Use it to build a custom plot. | `label` **required**, `data`, `description`, `categoryHeading` `valueHeading` `formatValue`, `tableToggle` (when `false`, the table is present but visually hidden), `children` = your `<svg>`                                                                |
| `ChartAxis`      | Axis line + tick labels, in plot units.                                                            | `orientation` (`left` `bottom`), `ticks` `length`, `hideLine`                                                                                                                                                                                                 |
| `ChartGrid`      | Reference lines at given offsets.                                                                  | `positions` `length` `orientation`                                                                                                                                                                                                                            |
| `ChartDataLabel` | Value label anchored to a mark.                                                                    | `x` `y`, `placement` (`above` `below`)                                                                                                                                                                                                                        |
| `ChartTooltip`   | Hover readout.                                                                                     | `x` `y` as **percentages of the plot box** (0–100), so it tracks the scaling SVG without measuring                                                                                                                                                            |

## Board

A controlled Kanban board. The consumer owns the data (`KanbanBoardData` =
`columns` + a normalized `cards` record); the board emits `KanbanCommand`s and
never mutates anything itself. Card order lives on the column's `cardIds`, so a
move is a list splice.

Every move — pointer drag and keyboard alike — goes through the same pure
`applyKanbanCommands` reducer, so the two paths can't disagree about index
semantics. **Keyboard is a first-class path, not a fallback**: Space/Enter picks
a card up, arrows move it, Space/Enter drops it, Escape restores its original
position, and each step is announced through a live region. Invalid commands
(unknown card or column) are dropped and reported rather than throwing.

`wipLimit` is advisory — an over-limit column is reported in words, never
blocked, since refusing the drop would strand a card mid-move.

| Component      | What it does                                    | Key props                                                                                                                                                                                           |
| -------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KanbanBoard`  | The board: columns, drag, keyboard moves, a11y. | `board`/`defaultBoard`/`onBoardChange`, `onCommand` (fires per applied command — the audit seam), `renderCard`, `cardMenu` `hideCardDelete` `cardActions`, `statusLabels`, `disabled`, `aria-label` |
| `KanbanColumn` | One column's chrome and drop region.            | `column`, `active` (board-owned, set mid-drag), `emptyState`                                                                                                                                        |
| `KanbanCard`   | One card's face. Holds no state of its own.     | `card`, `dragging` `lifted` `highlighted` (board-owned), `actions`, `statusLabels`, `renderCard`                                                                                                    |

A card's `status` (`success` `warning` `danger`) renders its label as **visible
text** via `Badge`, not a bare coloured dot — status colour is never the sole
carrier of meaning. Override the wording with `statusLabels`.

**Three input paths, one reducer.** Dragging draws a line at the exact
insertion point while the card tracks the cursor. Keyboard moves work as above.
And every card carries an overflow menu (`cardMenu`, on by default) listing
every other column plus `Delete` — the only _discoverable_ pointer affordance,
since dragging advertises nothing and on touch sits behind a long press. Use
`hideCardDelete` to drop the destructive item, `cardMenu={false}` to remove the
menu entirely, and `cardActions` to add your own controls (pointer events inside
them never start a drag).

### Driving the board by prompt

`aiPrompt` adds a natural-language bar. Like every AI prop here it renders
nothing unless there's a way to resolve a prompt — an ancestor `AIProvider`
**or** a `resolveCommands` of your own (both are explicit opt-ins). With
neither, the board's markup is byte-identical to the non-AI rendering.

What comes back is classified by **blast radius**, because treating every
response alike either turns "what's blocked?" into a scary confirmation dialog
or lets "tidy the backlog" rewrite forty cards unseen:

| Response                    | What happens                                                   |
| --------------------------- | -------------------------------------------------------------- |
| No commands                 | Answer shown and announced; cards highlighted; board untouched |
| 1 non-destructive command   | Applied immediately, with an undo `Toast`                      |
| >1 command, or any `delete` | Staged in `KanbanChangePreview` for per-item review            |
| Unparseable prose           | Treated as an answer, not an error                             |

Commands are validated against the board on **every** path, including your own
`resolveCommands` — a hallucinated card id is dropped and reported, never
thrown or half-applied. Undo needs a `ToastProvider`; without one the change
still applies and is announced through the board's live region.

| Component             | What it does                                   | Key props                                                     |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| `KanbanPromptBar`     | The prompt input; `@` references a card by id. | `cards` `onSubmit`, `status` `error` `disabled` `placeholder` |
| `KanbanChangePreview` | Staged diff with per-command accept/reject.    | `board` `commands` `rejected` `message` `onAccept` `onReject` |

Supporting exports: `useKanbanCommands` (the pipeline), `kanbanSnapshot` +
`buildKanbanPrompt` (the budgeted prompt payload — every column is always
included, cards are dropped from the end), `parseKanbanResolution` (the
fallback text parser), and `describeKanbanCommand` (plain-language rendering of
one command).

## Canvas

An infinite, pannable, zoomable workspace of positioned blocks. Consumer owns
the data (`CanvasScene` = `blocks` + `connectors`); the canvas emits
`CanvasCommand`s and mutates nothing itself.

Built from **DOM, not `<canvas>`** — blocks are real elements inside one
transformed world div, so any component can be a block, tokens and themes apply
for free, and blocks stay focusable. Blocks store plain canvas coordinates; a
single `transform` carries pan and zoom, so nothing downstream needs to know
the viewport exists.

**Accessibility.** Blocks stay in the accessibility tree as labelled groups —
they hold real text and real controls, so hiding them would strand focusable
elements inside an `aria-hidden` subtree. Only the connector SVG is hidden,
being pure geometry. `CanvasOutline` supplies what a screen reader _can't_
perceive: reading order (top-to-bottom, then left-to-right, with a row
tolerance) and the connector graph stated as text. It's a navigation aid over
the blocks, not a substitute for them.

Pointer: drag to move, drag empty space to marquee-select, Alt- or middle-drag
to pan (works over a block too), Ctrl/Cmd+wheel to zoom about the cursor,
double-click a note to edit. Keyboard: arrows nudge, Shift+arrows step further,
**Alt+arrows resize** (so the keyboard reaches the drag handles' outcomes
without eight extra tab stops per block), Enter edits, Delete removes, Escape
deselects — each announced through a live region.

| Component          | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                     | Key props                                                                                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Canvas`           | The workspace: viewport, selection, gestures, outline.                                                                                                                                                                                                                                                                                                                                                                                           | `scene`/`defaultScene`/`onSceneChange`, `onCommand`, `selectedIds`, `grid`, `outlineVisible`, `readOnly`, `renderBlock`, `viewport`/`defaultViewport`/`onViewportChange`, `renderBackdrop`, `aiPrompt` `aiPromptFloating` `aiRewrite` `aiCluster` `aiDiagram` |
| `CanvasBlock`      | Positioned, selectable, resizable wrapper + face.                                                                                                                                                                                                                                                                                                                                                                                                | `block`, `selected` `highlighted` `editing` `resizable`, `renderBlock`                                                                                                                                                                                        |
| `CanvasConnector`  | One SVG edge with arrowheads and a label.                                                                                                                                                                                                                                                                                                                                                                                                        | `scene` `connector`, `selected`                                                                                                                                                                                                                               |
| `CanvasOutline`    | The accessible linear twin.                                                                                                                                                                                                                                                                                                                                                                                                                      | `scene`, `visible`, `selectedIds` `onSelect`, `rowTolerance`                                                                                                                                                                                                  |
| `StickyNote`       | Tinted note, editable in place.                                                                                                                                                                                                                                                                                                                                                                                                                  | `text` `tone` `color` (arbitrary hex fill, layers over `tone`'s accent edge — user content, not a token), `editing` `onTextChange` `onEditingEnd`                                                                                                             |
| `CanvasShape`      | Flowchart vocabulary via `clip-path`. No separate `circle` kind — `shape="ellipse"` with equal width/height renders as one.                                                                                                                                                                                                                                                                                                                      | `shape` (`rectangle` `ellipse` `diamond` `triangle` `parallelogram`), `text` `tone` `color` (same free-fill escape hatch as `StickyNote`)                                                                                                                     |
| `CanvasEmbed`      | HTML or a URL in a sandboxed iframe.                                                                                                                                                                                                                                                                                                                                                                                                             | `url` \| `html`, `title` **required**                                                                                                                                                                                                                         |
| `CanvasFrame`      | Named bounded region — unfilled: a boundary, not a surface. Dragging or keyboard-nudging a selected frame carries every block whose centre point currently falls inside it, computed fresh each time (`withFrameMembers`, `canvasGeometry.ts`) rather than a stored relationship — a block dragged out on its own simply stops counting. Membership doesn't join the selection itself, so deleting a selected frame doesn't delete its contents. | `title` `tone`                                                                                                                                                                                                                                                |
| `CanvasChecklist`  | Tickable task list; the one block face with state.                                                                                                                                                                                                                                                                                                                                                                                               | `items` `title`, `onItemToggle` (omit for a read-only, genuinely disabled list)                                                                                                                                                                               |
| `CanvasFillPicker` | Trigger + `Popover` for a block's `color` — preset swatches plus a full `ColorPicker`. Shown by `CanvasBlock` only while a `sticky`/`shape` block is selected.                                                                                                                                                                                                                                                                                   | `value` `onChange`, `presets` (defaults to `DEFAULT_CANVAS_FILL_PRESETS`), `triggerLabel`                                                                                                                                                                     |

### Block kinds

`sticky`, `text`, `image`, `shape`, `divider`, `embed`, `frame`, plus `code`
(`code`, `language`), `table` (`columns`, `rows`, `caption`), `link` (`url`,
`title`, `description`), `checklist` (`title`, `items`), `chart` (`label`,
`data`, `chartType`), and `document` (`pages`, `aspectRatio`, `layout`,
`header`, `footer` — see `Document`/`DocumentPage` below).

All but `checklist` and `document` are delegation to components that already
exist — `Code`, `Table`, `Link`, `ChartSurface`, `Image`, `Divider` — so they
add no folders. `checklist` is the exception because it is the one face with
state of its own; a tick becomes an `update` command through the reducer, the
same path a model's change takes. `document` delegates to `Document` itself
(`chrome={false}`), and is the one kind with a dedicated double-click
behaviour: opening its editor enters `Canvas`'s own focus mode, locked by
default (see "Navigating the canvas" below). A short table row renders as
empty cells rather than a ragged grid, and a `link` always carries
`rel="noopener noreferrer"`.

### Navigating the canvas

| Gesture                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| Wheel / two-finger swipe  | Pans freely, both axes                        |
| Shift + wheel             | Pans sideways (a mouse only reports one axis) |
| Ctrl/Cmd + wheel          | Zooms about the pointer                       |
| Alt-drag, middle-drag     | Pans                                          |
| Arrows (nothing selected) | Pan; Shift for a bigger step                  |
| Ctrl/Cmd + arrows         | Pan even with a block selected                |
| `+` `-` `0` `1`           | Zoom in, zoom out, reset, zoom to fit         |
| PageUp / PageDown         | Jump vertically                               |
| Arrows (block selected)   | Nudge it; Alt+arrows resize; Delete removes   |
| `F` (block selected)      | Enter/exit focus mode on it — see below       |
| `L` (focused)             | Lock/unlock focus                             |

The wheel listener is bound natively rather than via `onWheel`: React registers
wheel handlers as passive, where `preventDefault` does nothing, so the page
would scroll away underneath the gesture and Ctrl+wheel would zoom the browser.

**A press on a control inside a block never starts a drag** — links, buttons,
inputs and checkbox labels belong to themselves. Pointer capture is taken only
once a drag passes its threshold, because a captured pointer never delivers its
click to what it pressed. Such a block is dragged by its title or padding.

**Dragging snaps to the grid, then to nearby objects.** The existing `grid`
prop snaps move/resize to a fixed spacing; independently, dragging a block (or
a multi-selection, or a frame with the members it carries — see `CanvasFrame`
above) also magnetically snaps its edges/centers to nearby blocks' edges and
centers within a small threshold, drawing a thin alignment guide line while
snapped (`snapToObjects`, `canvasGeometry.ts` — pure and unit-testable).
Object-snap wins over grid-snap per axis; an axis with no nearby match still
falls back to the grid.

**Focus mode** isolates one block: `F` zooms/centers the viewport on it and
dims everything else (via layering against `--ds-color-surface-overlay`, not
per-block opacity — there's no opacity token to alias). While focused, only
that block responds to pointer interaction; press `F` again or `Escape` to
exit (`Escape` leaves the selection as-is). `L` locks focus, freezing
pan/zoom/scroll entirely — wheel, keyboard, and pointer-pan all no-op — while
the focused block itself stays fully interactive (drag, resize, edit,
keyboard-nudge). Unlocked, panning/zooming away from the focused block is
still allowed; the dim and the interaction restriction persist either way.

### External backdrops and a controlled viewport

`renderBackdrop` renders beneath every block, inside the same world
`transform`, so a consumer-supplied layer (e.g. a `pdf.js`-rasterized page)
shares the canvas coordinate space and pans/zooms in lockstep with blocks
placed over it — one call, `aria-hidden` since a raster backdrop carries no
text of its own; overlaid content stays a real, readable block. `viewport`/
`defaultViewport`/`onViewportChange` put pan/zoom under the same
controlled/uncontrolled contract as `scene`, for a page that needs to read or
drive the viewport from outside (`useCanvasViewport` itself takes the same
`viewport`/`onViewportChange` pair). Together these replace the
`useCanvasViewport()` + manual wrapper composition `docs/COMPONENT_LIST.md`
records as a real consumer's stopgap for overlaying selectable regions on
external raster content.

There is no painted grid: the surface is the recessed neutral and block faces
sit on the lighter one. `grid` (snapping) is unrelated and still there.

### Driving the canvas by prompt

`aiPrompt` adds a natural-language bar; `aiRewrite` adds a per-note "Rewrite
with AI" trigger. Both render nothing unless there's a way to resolve them —
an ancestor `AIProvider`, or (for `aiPrompt` only) a `resolveCommands` of your
own. With neither, the canvas's markup is byte-identical to the non-AI
rendering.

Responses are classified by **blast radius**, as on `KanbanBoard`:

| Response                       | What happens                                              |
| ------------------------------ | --------------------------------------------------------- |
| No commands                    | Answer shown and announced; blocks highlighted; untouched |
| A lone `create`                | Applied immediately, with an undo `Toast`                 |
| Anything else, or any `delete` | Staged in `CanvasChangePreview` for per-item review       |
| Unparseable prose              | Treated as an answer, not an error                        |

The canvas moves that line in one place versus the board: a lone `create` is
additive and trivially undone, so it applies straight away. Anything that
_changes or removes_ existing content is staged.

Commands are validated on **every** path, including your own
`resolveCommands` — a hallucinated id is dropped and reported. Validation is
sequential, so a `create` followed by a `connect` naming it both succeed, and
the preview names blocks created in the same batch rather than showing raw ids.

`CanvasResolution` (and the default JSON shape) carries an optional
`thinking` alongside `message` — the model's own brief account of why it
chose these commands or none. `useCanvasCommands` exposes it as `thinking`,
rendered two different ways depending on where it lands: the static bar
shows it as a `ThinkingBlock` (collapsed by default, expandable) above the
answer, while `CanvasChatPanel` shows a compact, **non-expandable** two-line
summary instead — a "Thinking" heading with `TypingIndicator`'s three dots,
then one CSS-truncated line of the text itself; there's no control that
reveals more of it than that one line. Only `submit` populates `thinking` —
`cluster` and `diagram` resolve to a different response shape with no room
for it, and clear any stale `thinking` from an earlier prompt. Rendered
verbatim like `message`, never parsed for intent.

| Component             | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Key props                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CanvasPromptBar`     | Prompt input; `@` references a block by id. `variant="minimal"` drops the border/background and the Send button (Enter still submits) — for a chrome-light host like `CanvasChatPanel` rather than a toolbar row; `"default"` (unchanged) elsewhere.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `blocks` `onSubmit`, `status` `error` `disabled` `variant`                                                                                             |
| `CanvasChangePreview` | Staged diff with per-command accept/reject.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `scene` `commands` `rejected` `message` `onAccept` `onReject`                                                                                          |
| `CanvasChatPanel`     | Draggable, minimizable floating chat over the canvas — `Canvas`'s `aiPromptFloating` decouples `CanvasPromptBar` from the static row into this instead. Never closable — minimize by double-clicking the header, its hover/focus-revealed icon button, or an opt-in `minimizeShortcut` chord. Shows the last submitted prompt as a `MessageBubble`, the reply as plain text, and `thinking` as a compact non-expandable two-line summary above the reply. `selectedBlocks` (and so both the prompt's embedded context and the chip row) already includes a selected frame's members, expanded by `Canvas` via `withFrameMembers` before the prop reaches this component — the panel itself just renders whatever list it's given. The selection is named chip-by-chip up to `MAX_SELECTION_CHIPS`, then collapses to one "N items selected" chip. | `blocks` `selectedBlocks` `onSubmit`, `status` `error` `lastMessage` `lastMessageVariant` `thinking` `title` `minimizeShortcut` `disabled` `boundsRef` |

Supporting exports: `useCanvasViewport` (pan/zoom + `toCanvas`/`toScreen`),
`applyCanvasCommands`, `useCanvasCommands` (the pipeline), `canvasSnapshot` +
`buildCanvasPrompt` (the budgeted payload — geometry is content here, and the
scene's bounds ride along so generated blocks don't stack at the origin),
`parseCanvasResolution`, `describeCanvasCommand`, and `canvasGeometry`'s pure
helpers — `connectorGeometry`, `resolveAnchorSides`, `snapToGrid`,
`outlineOrder`, `buildCanvasOutline`.

### Affinity mapping (`aiCluster`)

`aiCluster` adds a **Group by theme** trigger: the notes are read, grouped by
meaning, and each group gets a titled `CanvasFrame` with its members laid out
inside. Same availability rule as `aiPrompt` — an `AIProvider` or a
`resolveClusters` of your own, and nothing rendered without either. It's also
hidden under `readOnly`, since clustering is an edit.

Always staged, never auto-applied: it rearranges work the user arranged
themselves, which is exactly what the review panel is for. Select two or more
blocks first to group only those; otherwise every text-bearing block is in play
(`sticky`, `shape`, `text` — frames are containers, and images and dividers
have nothing to read an affinity from).

**The model is asked only which blocks belong together, never where to put
them.** Placement is `clusterCommands`, which is pure and deterministic: a grid
per frame, sized from the largest member so nothing overlaps, laid out clear of
everything that isn't moving, and no block is ever resized. A model asked for
coordinates returns overlapping boxes; a model asked for themes is doing the
part it's actually good at. Groups are validated exactly as commands are — an
unknown id, or a block claimed by two groups, is dropped and reported in the
preview's message.

Cluster exports: `clusterCommands`, `normalizeCanvasClusters`,
`parseCanvasClusterResolution`, `buildCanvasClusterPrompt`,
`clusterCandidates`/`isClusterCandidate`, `DEFAULT_CLUSTER_LAYOUT`.

### Diagram generation (`aiDiagram`)

`aiDiagram` adds a bar you describe a flow into ("the sign-in flow", "our
release pipeline"); it's drawn as shapes and connectors. Same availability rule
again — an `AIProvider` or a `resolveDiagram` — and hidden under `readOnly`.

**Applied straight away with an undo toast**, unlike clustering. A generated
diagram adds content and touches nothing that was already there, so there is
nothing to review; approving a list of "Add shape" lines is a worse way to
judge a drawing than looking at it. The additive claim is checked
(`isPurelyAdditive`), and anything failing it falls back to the review panel.

The model returns a **graph** — nodes with a `role` and edges between them — and
no coordinates. The library owns everything spatial:

| Step                  | What it does                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `breakDiagramCycles`  | Splits back edges out so a retry loop can't invert the reading order  |
| `rankDiagramNodes`    | Longest-path ranking over the forward graph, compacted to consecutive |
| `layoutCanvasDiagram` | Ranks along the direction, ordered by declaration, each rank centred  |
| `diagramCommands`     | Title frame + a shape per node + an orthogonal connector per edge     |

`role` (`start` `end` `process` `decision` `input` `output`) maps onto the
shape vocabulary — a decision is a diamond — because whether a step branches is
a fact about the process, while "decisions are diamonds" is a drawing
convention this library already knows. A `shape` may still be given and wins.
The shape is never the only carrier of meaning: `CanvasShape` renders geometry
with no semantics, so the label has to read as a question too.

Diagram exports: the four above plus `normalizeCanvasDiagram`,
`parseCanvasDiagramResolution`, `buildCanvasDiagramPrompt`, `diagramNodeShape`,
`isPurelyAdditive`, `DEFAULT_DIAGRAM_LAYOUT`.

**Frames are unfilled boundaries**, not surfaces — a dashed edge plus a title.
A filled frame hid everything placed on it: the connector layer sits under the
blocks, and `surface-secondary` is exactly the fill a clipped `CanvasShape`
uses, so a diamond on a frame vanished. Connectors also paint _above_ frames
and below other blocks, since a frame is a region an edge runs through.

**`CanvasEmbed` sandboxing.** Content never goes through
`dangerouslySetInnerHTML`; it renders in an iframe with `allow-scripts` but
deliberately **without** `allow-same-origin`. Granting both together is
equivalent to no sandbox at all — the frame could reach the parent document and
strip its own sandbox attribute.

**Note and shape `tone`** is one of the five semantic roles, not a free colour,
and is decoration only: the block's own text carries its meaning. A wider
whiteboard palette is blocked on the same Foundation gap as chart series colour.

### Document and DocumentPage

A simple multi-page note/resume editor — not a document engine (no true
content reflow across pages) — usable standalone in plain HTML or embedded in
a `Canvas` block (the `document` kind above). `DocumentPage` is the single
fixed-aspect-ratio "sheet" (reuses `Card`'s box), a compound component:
`<DocumentPage><DocumentPage.Header/><DocumentPage.Body layout="sidebar"/><DocumentPage.Footer/></DocumentPage>`,
all three parts optional. `Document` manages an array of pages (`pages`, HTML
strings, controlled/uncontrolled like `Canvas`'s `scene` — the seam a future
AI/chat component would edit through, the same `onPagesChange` a person's own
typing already goes through) and mounts a `RichTextEditor` per page while
`editable`.

| Component      | What it does                                                            | Key props                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DocumentPage` | One page's fixed-aspect-ratio surface.                                  | `aspectRatio` (`'a4'` \| `'16:9'` \| `'4:3'` \| `{width, height}`, defaults `'a4'`); `Header`/`Body` (`layout`: `'single'` \| `'two-column'` \| `'sidebar'`)/`Footer` parts                                                                                                                                                                                                                                                                                                                                                                                   |
| `Document`     | Multi-page container — standalone viewer chrome, or bare for embedding. | `pages`/`defaultPages`/`onPagesChange`, `aspectRatio`, `layout`, `name`/`onNameChange` (document identity label), `header`/`footer` (static `ReactNode`, every page), `headerValue`/`defaultHeaderValue`/`onHeaderChange` and `footerValue`/`defaultFooterValue`/`onFooterChange` (opt the header/footer into a real editable surface while `editable`), `editable`, `view`/`defaultView`/`onViewChange` (`'list'` \| `'grid'`), `tocOpen`/`defaultTocOpen`/`onTocOpenChange`, `chrome`, `activePageIndex`/`defaultActivePageIndex`/`onActivePageIndexChange` |

**Header/footer editing is opt-in and separate from the static slot.** `header`/`footer` stay a plain `ReactNode` — arbitrary JSX, never editable. Supplying `headerValue` (or `defaultHeaderValue`/`onHeaderChange`) switches _that_ page region from the static slot to a `RichTextEditor` bound to that HTML string, the same controlled/uncontrolled shape `pages` uses. A page with no header/footer editing opted in renders exactly as before. `DocumentPage`'s header/footer no longer draw a divider against the body — header, body, and footer read as one continuous page. `DocumentPage`'s outer sheet is flat, not rounded (`.page.page { border-radius: 0 }`, a doubled-class override of `Card`'s own radius rule) — a page reads as a sheet of paper, not a rounded UI card.

**`name` is the document's own identity (a file name), supplied by the consumer — not in-page content.** It renders as a small tab-style label above the page's top-left corner, once, above whichever page is currently visible (the only page in `chrome={false}` embedding, or page 1 in the standalone viewer). It's deliberately separate from `header`/`headerValue`, which is in-page content (a resume's masthead) that prints/exports with the page — `name` never does. Double-clicking the tag swaps it for a text input, committed on Enter/blur and discarded on Escape — but only when `onNameChange` is supplied, the same "a callback is the opt-in" shape the rest of `Document`'s editable surfaces use; without it the tag stays a static label. The tag's wrapper (`.namedPage`) deliberately doesn't stretch to the viewport's full width — `.world` centers each page by letting it shrink to its own `24rem`/`16rem`, and a full-width wrapper around just the named page would pin _that_ page to the left edge while every other page stayed centered, reading as misaligned rather than as one consistent stack.

**`tocOpen`/`defaultTocOpen`/`onTocOpenChange`** (standalone `chrome` only) show/hide a table-of-contents panel to the left of the page(s), listing every `h1`–`h6` found across `pages` (re-parsed via `DOMParser` whenever `pages` changes); clicking an entry jumps to its page (`goToPage` — a heading only ever needs its page, never a scroll offset, since a page's body is a fixed, clipped box that doesn't scroll internally). The toggle icon at the start of the toolbar, and the panel itself, render only when at least one heading exists — an empty panel never takes up space.

**One shared formatting toolbar, not one per region.** Every `RichTextEditor` `Document` mounts (header, body, footer) renders `showToolbar={false}` — `Document` itself renders a single toolbar above the page while `editable`, acting on whichever of the three surfaces was last focused (the same "save the selection `Range` on blur, restore it immediately before the command" technique `RichTextEditor`'s own link popover uses, generalized from one surface to three). Alongside bold/italic/underline/lists/link sits a paragraph-style `Select` — `Heading 1`–`6`, `Body`, `Caption`, `Quote`, `Note` — applied via `execCommand('formatBlock', ...)`; `Caption`/`Note` have no native block tag, so both format as `<p>` and are told apart by a CSS class applied afterward. The style picker sits outside the roving `role="toolbar"` group as its own tab stop, the same precedent `RichTextEditor`'s AI trigger already set for "a control that isn't a formatting command."

**Auto-pagination only ever adds a page — it never re-flows already-typed
content backward.** While `editable`, each keystroke's `onChange` schedules an
overflow check (`setTimeout`, not `requestAnimationFrame` — rAF never fires at
all in a backgrounded/unpainted tab, a real failure mode for a canvas app
switched away from mid-paste, not just a test-environment quirk) comparing the
last page's body `scrollHeight` to its fixed `clientHeight`; once it overflows,
a blank page is appended and the active index follows it. `DocumentPage.Body`
forwards its ref specifically so this measurement is possible — and
`Document`'s own `.editor` wrapper around `RichTextEditor` uses `min-height:
100%`, not `height: 100%`: a fixed height would silently absorb the overflow
right there, before it ever reaches the body node this check actually reads.

**`chrome`** (default `true`) is the standalone/embedded switch: `true` renders
the list/grid toggle, zoom controls (buttons plus Ctrl/Cmd+wheel), and a
scrollable viewport holding every page; `false` renders only the active page,
plain — how `Canvas` embeds it, since a canvas block already owns its own
pan/zoom and a second one nested inside would fight it.

**Arrow keys move between pages** (Left/Right or Up/Down) whenever focus isn't
inside a page's own `[contenteditable]` — otherwise the caret could never
reach a line's start/end. `Escape`-equivalent page-clamping is silent: moving
past the first/last page is a no-op that doesn't fire `onActivePageIndexChange`,
so a listener isn't told "you're on page 1" on every repeated boundary press.

## Utilities

| Component   | What it does                                                                           | Key props                                                 |
| ----------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `Portal`    | Renders children elsewhere in the DOM. Forwards no ref — it has no element of its own. | `container` (node or getter; defaults to `document.body`) |
| `FocusTrap` | Confines Tab focus to its subtree.                                                     | `active`, `initialFocusRef`                               |

## Mobile

| Component          | What it does                             | Key props                                                                         |
| ------------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `BottomNavigation` | Fixed bottom tab bar. Compound: `.Item`. | `.Item`: `active` `icon` (decorative — `children` is the accessible name) `badge` |

## AI

Shared primitives for the opt-in AI affordances. They need an ancestor
`AIProvider` (which takes your own `AIClient`); without one every `ai*` prop
is inert. The library never bundles a vendor SDK or a tokenizer.

| Component             | What it does                                                                  | Key props                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AITriggerButton`     | The standard sparkle trigger — an `IconButton` driven by an `AIActionStatus`. | `aria-label` **required**, `status`                                                                                                               |
| `AISuggestionPopover` | The standard result surface: streaming text, error/retry, accept/reject.      | `triggerLabel` **required**, `status` `result` `error`, `onAccept`/`onReject`/`onRetry` (omit `onAccept` for read-only explanations), `placement` |

## AI chat

| Component              | What it does                                      | Key props                                                                                                                         |
| ---------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `MessageBubble`        | Chat message shell.                               | `variant` (`user` `ai` `system` `tool` `error` `status`), `avatar` slot (omit for senderless variants)                            |
| `MessageMeta`          | Sender + timestamp row.                           | `sender`, `timestamp` — a `Date` is locale-formatted to hour/minute; any other node renders as-is                                 |
| `MessageActionBar`     | Regenerate/copy/explain toolbar.                  | `onCopy` `onRegenerate` `onContinue` `onSimplify` `onExplain`, `extraActions` for anything else                                   |
| `FeedbackControl`      | Thumbs up/down (+ optional report).               | `value` (`'up' \| 'down' \| null`), `onChange` (fires with `null` when un-toggled), `onReport`                                    |
| `CitationMarker`       | Inline footnote marker.                           | `index` **required**, `label` (defaults to "Citation {index}"), `href` → `<a>`, `onClick` → `<button>` (ignored if `href` is set) |
| `CitationCard`         | Source card.                                      | `title` **required**, `index` `source` `snippet`, `href` (makes the whole card one real `<a>`)                                    |
| `ThinkingBlock`        | Collapsible reasoning trace.                      | `label` (default "Show reasoning"), `open`/`onOpenChange`                                                                         |
| `ToolTraceViewer`      | Ordered tool-execution log.                       | `steps` (each with a `pending`/`active`/`done`/`error` status)                                                                    |
| `StatusLine`           | "Searching the web…" status row, `role="status"`. | `children` (the announced text), `icon` (decorative override)                                                                     |
| `TypingIndicator`      | Animated typing dots.                             | `size`, `label` (default "Typing")                                                                                                |
| `StreamingCursor`      | Blinking caret for streaming text.                | `<span>` props only                                                                                                               |
| `CodeBlockToolbar`     | Copy/download/run/expand bar above a code block.  | `label`, `onCopy` `onDownload` `onRun`, `expanded`/`onExpandedChange` (omit both to hide the toggle)                              |
| `MentionPicker`        | `@`-mention panel.                                | `open` `anchorPoint` (viewport point — you compute the caret position), `options` `onSelect` `onClose`                            |
| `SlashCommandPicker`   | `/`-command panel; same shape as `MentionPicker`. | `open` `anchorPoint` `commands` `onSelect` `onClose`                                                                              |
| `PromptTemplatePicker` | Template dropdown for the composer.               | `templates` `onSelect`, `open`/`onOpenChange`, `triggerLabel`                                                                     |
| `TokenCounter`         | Live token estimate for composer text.            | `value`, `estimateTokens` (defaults to the ~4-chars-per-token rule of thumb — pass a real tokenizer for exact counts), `limit`    |
| `ConversationHeader`   | Title, tags, model badge, participants, actions.  | `title` **required**, `tags` `modelUsed` `participants` (slot, e.g. an `<AvatarGroup>`) `actions`                                 |
| `MemoryListItem`       | One saved memory row.                             | `onForget` (shows the button), `forgetLabel`                                                                                      |
| `MemoryEditor`         | Memory list + add/forget flow.                    | `memories` `onForget` `onAdd`                                                                                                     |

---

## Providers and hooks

| Export                                                                                                  | Purpose                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ThemeProvider` / `useTheme`                                                                            | Applies `data-theme` (light/dark/high-contrast) to `document.documentElement`. Components never branch on theme in JS — CSS variables do it.      |
| `ToastProvider` / `useToast`                                                                            | Toast queue. `useToast()` gives `toast()`, `dismiss(id)`, `dismissAll()`; throws outside a provider.                                              |
| `AIProvider` / `useAI`                                                                                  | Supplies the `AIClient` every `ai*` prop routes through. `useAI()` returns `undefined` when unmounted, which is what makes the affordances inert. |
| `useAIAction`                                                                                           | Runs one AI call with the `idle`/`streaming`/`done`/`error` status vocabulary the AI components share.                                            |
| `useControllableState`                                                                                  | The controlled/uncontrolled prop pattern used throughout.                                                                                         |
| `useFieldContext`                                                                                       | Reads the id/aria wiring `Field` provides to its control.                                                                                         |
| `useFocusTrap`, `useClickOutside`, `useEscapeKey`, `useRovingFocus`, `usePositioning`, `usePointerDrag` | Overlay, keyboard-nav, and drag primitives behind the interactive components.                                                                     |
| `useChartScale` (+ `createLinearScale`, `createBandScale`, `resolveChartFrame`)                         | Scale/frame math for custom plots.                                                                                                                |
| `mergeClasses`, `mergeRefs`, `resolveSpace`, `resolveSpacingStyle`                                      | Class/ref merging and `SpaceValue` → CSS resolution.                                                                                              |
