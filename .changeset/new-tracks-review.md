---
'@mellon-design/react': minor
---

Add `SegmentTrack`, a horizontal duration-scaled track of disjoint labelled regions that doubles as a review queue — built from a real consumer component request (a same-speaker-detection review UI): a video's full duration mapped to a track, with an engine's candidate segments drawn on it as clickable, keyboard-navigable regions.

Fully controlled: `segments` is `{ id, start, end, state, confidence? }[]`, with `state` one of `candidate` | `excluded` | `selected` | `accepted` | `rejected` — the consumer re-renders with updated `state` values to reflect any decision, the same "component stays dumb, consumer owns the decision" split `FileUpload`/`DataGrid` already draw. Clicking (or arrow-navigating to) a region fires `onSegmentClick(id)`; clicking the empty track fires `onSeek(time)`. An optional `waveform` prop renders pre-computed amplitude peaks as decorative background context, and `currentTime` renders a playhead marker.

Not `Timeline` (an event log, not a duration-proportional axis) and not a `RangeSlider` composition (N independently-labelled, non-adjustable regions with per-region state, not one draggable min/max pair). Drag-to-resize a segment's boundaries is deliberately out of scope for this release.
