---
'@mellon-design/react': minor
---

`Document` gets a consumer-supplied, double-click-editable `name` label, a table-of-contents panel, and a flat (unrounded) page.

- **New `name`/`onNameChange` props.** The document's own identity (a file name), supplied by the consumer rather than typed into the page — renders as a small tab-style label above the page's top-left corner, separate from `header`/`headerValue` (in-page content that prints/exports with the page). Double-clicking the tag swaps it for a text input (committed on Enter/blur, discarded on Escape) when `onNameChange` is supplied; without it the tag stays a static label.
- **New table-of-contents panel** (`tocOpen`/`defaultTocOpen`/`onTocOpenChange`, standalone `chrome` only): lists every `h1`–`h6` found across `pages`, clicking an entry jumps to its page. A toggle icon at the start of the toolbar shows/hides it; both render only when at least one heading exists.
- **`DocumentPage`'s outer sheet is now flat, not rounded** — `.page.page { border-radius: 0 }` overrides `Card`'s own radius (doubled-class, so it wins regardless of stylesheet load order). A document page reads as a sheet of paper, not a rounded UI card.
