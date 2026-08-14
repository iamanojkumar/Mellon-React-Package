---
'@mellon-design/react': minor
---

Canvas phase 5: the rest of the block catalogue, and a viewport pass.

**New block kinds** — `code`, `table`, `link`, `checklist` and `chart`, joining
sticky/text/image/shape/divider/embed/frame. All but one are delegation to
components that already exist (`Code`, `Table`, `Link`, `ChartSurface`);
`checklist` gets its own `CanvasChecklist` because it is the only face with
state of its own, and a tick still travels as an `update` command through the
reducer. Each kind is parsed from an AI response and named in the outline
(a checklist reports its own progress there).

**Navigation.** The wheel now pans freely in both axes, Shift pans sideways,
and Ctrl/Cmd zooms about the pointer — bound as a native non-passive listener,
since React's `onWheel` is passive and the page scrolled away underneath the
gesture. The keyboard gained the whole viewport: arrows pan when nothing is
selected (Ctrl/Cmd forces it regardless), `+`/`-` zoom, `0` resets, `1` zooms
to fit, PageUp/PageDown jump. All of it works under `readOnly`, and zoom is
announced as a percentage.

**Look.** The painted grid is removed and the `showGrid` prop with it
(**breaking**, though `grid` — snap spacing — is unrelated and unchanged). The
surface is now the recessed neutral with block faces on the lighter surface, so
blocks sit on the workspace instead of dissolving into it.

**Fix:** a press on a control inside a block no longer starts a drag, and
pointer capture is deferred until a drag actually begins. A captured pointer
never delivers its click, which meant controls inside a block silently stopped
responding.
