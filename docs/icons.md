# Icons

`@mellon-design/react` takes `@mellon-design/icons` as a real dependency (added for the `Button.icon`
work; see the changeset `add-button-icon-prop.md`). This supersedes the old "no icon library"
rule for icons a **consumer** supplies through an existing slot prop — `Button.icon`, `IconButton`'s
children, `Badge`/`Tag`/`Timeline`/`TreeView`/`Sidebar`/`NavigationRail`/`BottomNavigation`/
`EmptyState`/`CommandPalette`/`SlashCommandPicker`/`StatusLine`'s `icon` — demonstrated in
`Button.stories.tsx`'s and `IconButton.stories.tsx`'s `FromMellonIconsPackage` stories.

What's unchanged: icons _owned by a specific component_ (`Video`'s `PlayIcon`/`PauseIcon`/
`VolumeIcon`/`MuteIcon`/`CaptionsIcon`, `Alert`/`Banner`/`Toast`'s shared `AlertVariantIcon`,
`AITriggerButton`'s internal `SparkleIcon`, `RichTextEditor`'s toolbar glyphs, `PasswordField`'s
eye icons, …) are still authored as inline SVG, not pulled from the package — see `CLAUDE.md`'s
"Icon library" note. A record/mic/folder/settings/save style shape still has no natural owning
component here, so it stays something a consumer passes in via `@mellon-design/icons` rather than
something this library exports standalone. `src/icons/` in the repo layout is still deliberately
empty for the same reason.

This file exists to track real icon needs surfaced by consumers of the library that the above
scope doesn't cover — the same "requirements doc for a known gap" role `docs/CHART_TOKEN_REQUIREMENTS.md`
plays for the Foundation's missing series-color tokens. **It is a record of what's been asked
for, not a promise to build any of it.**

## From the recording/transcription app

That app's own `CLAUDE.md` used to treat icons as the one exception to its "components only from
`@mellon-design/react`" rule — author them as inline SVG rather than pulling in an icon package.
That's superseded now that `@mellon-design/icons` exists on npm and this library depends on it
directly. Status = whether it's wired up today.

| Icon                         | Used for                             | Status                                                                                      |
| ---------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------- |
| Play                         | Video transport play button          | Done — reused `Video`'s exported `PlayIcon`                                                 |
| Pause                        | Video transport pause button         | Done — reused `Video`'s exported `PauseIcon`                                                |
| Record (dot)                 | Start-recording button               | Done — `@mellon-design/icons`' `RecordIcon` via `Button`'s `icon` prop                      |
| Stop (square)                | Stop-recording button                | Done — `@mellon-design/icons`' `StopIcon` via `Button`'s `icon` prop                        |
| Pause (recording)            | Pause-in-progress-recording button   | Done — `@mellon-design/icons`' `PauseIcon` via `Button`'s `icon` prop                       |
| Folder                       | "Choose output folder" header button | Done — `@mellon-design/icons`' `FolderIcon`/`DownloadFolderIcon` via `Button`'s `icon` prop |
| Settings (gear)              | Settings header button               | Needed — not in `@mellon-design/icons` v0.1.0; still a text-only `Button`                   |
| Save (disk / check)          | "Save clip" button                   | Needed — not in `@mellon-design/icons` v0.1.0; still a text-only `Button`                   |
| Transcribe (waveform → text) | "Extract script" button              | Done — `@mellon-design/icons`' `AudioWaveTranscriptionIcon` via `Button`'s `icon` prop      |

Not on this list because the library already renders them internally (not the consumer's to
author): `FileUpload`'s upload/drag icon, `Banner`/`Alert`'s status icon, `Dialog`'s close "×",
`AITriggerButton`'s sparkle, `PasswordField`'s show/hide-eye icon.

## What actually shipped, for verification

- `package.json` — `@mellon-design/icons` under `dependencies` (checked via `pnpm add`, confirmed
  present in `node_modules/@mellon-design/icons`, not just `tokens-web`).
- `@mellon-design/icons@0.1.0` exports (from its `dist/index.d.ts`): `PlayIcon`, `PauseIcon`,
  `StopIcon`, `RecordIcon`, `DownloadIcon`, `FolderIcon`, `DownloadFolderIcon`, `AudioWaveIcon`,
  `AudioWaveTranscriptionIcon`. No `Settings`/`Save` glyph exists in this version — re-check the
  package's exports before assuming those two rows are still unmet.
- `src/components/Button/Button.stories.tsx` and `src/components/IconButton/IconButton.stories.tsx`
  each have a `FromMellonIconsPackage` story importing directly from `@mellon-design/icons` and
  rendering through the real component (not a mock), verified live via `pnpm dev` in Storybook.

Each status above is a report from one point in time — re-verify before treating this list as
current if it's revisited later, especially the icon package's export list as it grows.
