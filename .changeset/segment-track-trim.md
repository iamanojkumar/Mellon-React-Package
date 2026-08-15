---
'@mellon-design/react': minor
---

Add `trimmable` to `SegmentTrack` — one continuous, draggable "Trim start"/"Trim end" selection independent of `segments`, reusing `Audio`'s own cross-clamped trim-handle shape (drag or arrow-key nudge, `Home`/`End`/`PageUp`/`PageDown`). New props: `trimmable`, `trimRange`/`defaultTrimRange`, `onTrimChange` (`{ start, end }` seconds), `trimStep`.

Trim state is reporting-only — `SegmentTrack` has no media element of its own, so "playback constrained to the selection" (mirroring `Audio`'s `trimmable` + `playTrimmedOnly` pair) is the caller's job: pair the reported `trimRange` with a `Video`/`Audio` ref's own playback controls, as shown in the new `Trimmable` story.

The segment `option`s now live in their own inner `role="listbox"` layer rather than on the outer track element, so the trim handles (`role="slider"`) can sit alongside them without violating `listbox`'s ARIA-required-children rule. This is an internal DOM restructure only — no prop or behavior change for existing `segments`/`selectedId`/`onSegmentClick`/`onSeek` usage.
