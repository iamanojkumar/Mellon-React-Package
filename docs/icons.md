# Icons

`@mellon-design/react` ships no general icon set — only a handful of icons bundled inside
specific components (`Video`'s `PlayIcon`/`PauseIcon`/`VolumeIcon`/`MuteIcon`/`CaptionsIcon`,
`AITriggerButton`'s internal `SparkleIcon`). Per `CLAUDE.md`'s "No icon library" rule, every icon
is authored as inline SVG (`currentColor`-stroked/filled so it inherits text color and theme
automatically) and exported only when a _component_ reuses the exact shape — never as a
standalone icon with no owning component. `src/icons/` exists in the repo layout but is
deliberately empty; filling it is its own scope decision, not something to do as a side effect
of closing an item on this list.

This file exists to track real icon needs surfaced by consumers of the library that the above
scope doesn't cover — the same "requirements doc for a known gap" role `docs/CHART_TOKEN_REQUIREMENTS.md`
plays for the Foundation's missing series-color tokens. **It is a record of what's been asked
for, not a promise to build any of it.**

## From the recording/transcription app

That app's own `CLAUDE.md` treats icons as the one exception to its "components only from
`@mellon-design/react`" rule — author them as inline SVG rather than pulling in an icon package.
This is the full list it needed. Status = whether it's wired up today.

| Icon                         | Used for                             | Status                                                                                                      |
| ---------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Play                         | Video transport play button          | Done — reused `Video`'s exported `PlayIcon`                                                                 |
| Pause                        | Video transport pause button         | Done — reused `Video`'s exported `PauseIcon`                                                                |
| Record (dot)                 | Start-recording button               | Needed — currently a text-only `Button`                                                                     |
| Stop (square)                | Stop-recording button                | Needed — currently a text-only `Button`                                                                     |
| Pause (recording)            | Pause-in-progress-recording button   | Needed — currently a text-only `Button` (could reuse the Play/Pause icon pair above instead of a new glyph) |
| Folder                       | "Choose output folder" header button | Needed — currently a text-only `Button`                                                                     |
| Settings (gear)              | Settings header button               | Needed — currently a text-only `Button`                                                                     |
| Save (disk / check)          | "Save clip" button                   | Needed — currently a text-only `Button`                                                                     |
| Transcribe (waveform → text) | "Extract script" button              | Needed — currently a text-only `Button`                                                                     |

Not on this list because the library already renders them internally (not the consumer's to
author): `FileUpload`'s upload/drag icon, `Banner`/`Alert`'s status icon, `Dialog`'s close "×",
`AITriggerButton`'s sparkle, `PasswordField`'s show/hide-eye icon.

## If this list is ever picked up

1. Match the sizing/stroke convention of `Video`'s exported icons (`viewBox="0 0 20 20"`,
   `width="1em" height="1em"`, `currentColor`, `aria-hidden="true"` — see
   `src/components/Video/Video.tsx`), so a new set doesn't visually clash with the ones already
   shipped.
2. Decide where they live _before_ writing any SVG. Every icon shipped so far belongs to a
   component (`Video`, `AITriggerButton`, `Alert`/`Banner`/`Toast` via `AlertVariantIcon`); a
   record/mic/folder/settings/save set has no natural owning component, so exporting them
   standalone would be the first shared, no-owning-component icon surface in this library — the
   deliberate architectural change `CLAUDE.md` flags `src/icons/` as waiting on. Confirm that
   decision explicitly rather than defaulting into it here.
3. Each entry above is a status-quo report from one consumer at one point in time — re-verify
   the "Needed" rows are still unmet (and that no new component has since grown the icon it
   needs) before treating this list as current.
