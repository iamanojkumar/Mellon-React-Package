---
'@mellon-design/react': minor
---

Add `icon`/`iconPosition` props to `Button` for a leading or trailing decorative glyph (hidden while `loading`). Add `@mellon-design/icons` as a dependency — this library previously shipped no icon package, authoring every icon as inline SVG owned by a specific component; the standing "no icon library" rule from `CLAUDE.md` is superseded for icons a consumer supplies through slot props like `Button.icon`, `IconButton`'s children, `Badge.icon`, etc. Icons still bundled inside individual components (`Video`, `Alert`/`Banner`/`Toast`'s `AlertVariantIcon`, ...) are unaffected.
