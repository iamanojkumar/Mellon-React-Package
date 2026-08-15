---
'@mellon-design/react': minor
---

Ship Phase 19's `Video` and `Audio` — the design system's first media-playback components.

`Video` wraps a plain `<video>` with fully custom, themed controls (native `controls` can't be styled with `--ds-*` tokens): play/pause, seek and volume (both reuse `Slider` directly rather than a hand-rolled thumb), mute, an optional captions (CC) toggle rendered only when `captions` WebVTT tracks are passed, and fullscreen. All playback state (`currentTime`, `duration`, `volume`, `muted`, `paused`) is read back off the element's own DOM events, so a browser-level gesture (a media key, an OS volume change) can't desync the UI from reality. Loading a **local file** is deliberately left to `FileUpload` — a consumer wires `onFilesAdded` to an object URL and hands it to `Video`'s `src`.

`Audio` is a clip player with a real rendered waveform, not a flat scrubber. `computePeaks` (pure, unit-tested) downsamples decoded PCM channel data to per-bucket peak amplitudes; the actual decode (`AudioContext.decodeAudioData`) is feature-detected and resolves to `null` on any failure — no `AudioContext`, an unreachable `src`, an unsupported codec, CORS — falling back to flat placeholder bars rather than inventing a waveform, the same refusal `LineChart` already applies to a missing reading.

The waveform track carries up to three independent `role="slider"` thumbs sharing one pointer-math helper: a "Seek" thumb (always present, doubling as the playhead) and, when `trimmable` is set, "Trim start"/"Trim end" thumbs using `RangeSlider`'s cross-clamped closer-thumb-wins shape. Each thumb owns its own `usePointerDrag` instance and isolates its own `onPointerDown` so grabbing a thumb doesn't also fire the track's click-to-seek handler for the same gesture.

**Trim state is reporting-only.** `onTrimChange` fires with `{ start, end }` seconds; no audio is re-encoded inside this library — producing the actual trimmed file is the consumer's job, the same boundary `AIClient` draws around completions. `playTrimmedOnly` constrains playback to the trimmed window without touching the underlying file at all.
