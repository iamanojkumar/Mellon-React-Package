---
'@mellon-design/react': minor
---

Fix `Video`/`Audio` to forward `ref` to their real `HTMLVideoElement`/`HTMLAudioElement`, matching this library's own "every component forwards ref" convention (both had been shipped without it). This unblocks anything needing the actual DOM node — most notably `AudioContext.createMediaElementSource`, which cannot work off a wrapper or a number. Both also gain `onTimeUpdate?: (currentTime: number) => void`, fired on every native `timeupdate`, for consumers who want a reactive readout rather than an imperative ref read.

`FileUpload` gains `variant?: 'dropzone' | 'button'` (defaults to `'dropzone'`, unchanged). `variant="button"` renders a plain themed trigger over the same hidden `<input type="file">` — no drop target, no rendered file list — for a one-shot "open a file" action where the picked `File` goes straight into other state (e.g. an object URL handed to `Video`) rather than being tracked as an upload. Same `onFilesAdded`/`onReject`/`accept`/`maxSize` contract either way; only the chrome changes. `files` is now optional (defaults to `[]`), since the button variant never renders a list.
