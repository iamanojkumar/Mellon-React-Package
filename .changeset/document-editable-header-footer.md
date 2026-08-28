---
'@mellon-design/react': minor
---

`Document`'s header/footer can now be edited in place, and its body editor no longer reads as a boxed control nested inside the page.

- **`RichTextEditor` gets `variant`/`showToolbar`/`minHeight`.** `variant="plain"` drops the toolbar's and editable surface's own border/background — for embedding inside a host that's already the box (here, `DocumentPage`), where a second nested box was redundant chrome, not a second control. `showToolbar={false}` renders a bare contentEditable surface with no formatting bar, for a header/footer that's a line of text, not a paragraph needing bold/lists/links. `minHeight` overrides the default `8em` sizing (meant for a full page of text) for a single-line use.
- **New `Document` props**: `headerValue`/`defaultHeaderValue`/`onHeaderChange` and `footerValue`/`defaultFooterValue`/`onFooterChange` — the same controlled/uncontrolled string shape `pages` already has. Supplying any of them switches the header/footer from the static `header`/`footer` `ReactNode` slot to a real editable surface while `editable` is `true`, so the whole page (header, body, footer) is one continuous editable document rather than the body alone.
- **`DocumentPage`'s header/footer no longer draw a divider** against the body — the three regions read as one page rather than three visually separated boxes.
- **`Canvas`'s `document` block wires this up**: double-clicking a document block now makes its header and footer editable together with the body (previously only the body entered edit mode), through the same `run`/reducer path `onPagesChange` already used — a hand-typed header and a model-set one go through one path.
