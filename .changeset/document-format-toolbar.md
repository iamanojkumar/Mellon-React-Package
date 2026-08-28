---
'@mellon-design/react': minor
---

`Document` now shows one formatting toolbar above the whole page, with a paragraph-style picker, instead of a toolbar wedged into the body alone.

- **One shared toolbar, not one per region.** Every `RichTextEditor` `Document` mounts for a page (header, body, footer) now renders `showToolbar={false}`; `Document` itself renders a single toolbar above the page while `editable`, acting on whichever of the three surfaces was last focused. It uses the same "save the selection `Range` on blur, restore it immediately before the command" technique `RichTextEditor`'s own link popover already relies on, generalized from one surface to three.
- **New paragraph-style picker**: `Heading 1`–`6`, `Body`, `Caption`, `Quote`, `Note`, applied via `execCommand('formatBlock', ...)`. `Caption`/`Note` have no native block tag, so both format as `<p>` and are told apart afterward by a CSS class.
- `RichTextEditor` gains `showToolbar` (already shipped alongside `variant`/`minHeight` in the previous release) as the seam this reuses — `Document` is its first consumer to actually turn it off.
