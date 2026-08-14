---
'@mellon-design/react': minor
---

Rework the Kanban board's drag interaction, add per-card actions, and refine the visual design.

**Drag now shows where the card will land.** Previously the card ghosted in place and only the target column's border changed, which told you _which_ column you were over but never _where_ in it — the difference between dropping a card and guessing. The dragged card now tracks the cursor, and a line marks the exact insertion point.

Two details that make this correct rather than merely animated. The dragged card keeps its DOM position and moves by `transform`, so its original slot stays open as a placeholder instead of the card jumping to a new position the instant the drag begins. And it is **excluded from hit-testing**: once it follows the pointer its measured rect is wherever the cursor is, not where it sits in the list. Excluding it also happens to produce exactly the index the reducer wants, since `move` means "position once the card has left its old slot" — so the indicator appears where the card actually lands even when it moves downward within its own column, which is the case an off-by-one would break.

**Cards now carry an overflow menu** (`cardMenu`, on by default) listing every other column plus `Delete`. This is the only _discoverable_ pointer affordance on the board: dragging advertises nothing, and on touch it's behind a long press. Every item runs through the same reducer and `onCommand` as a drag, and the board is controlled, so a consumer sees and can refuse each change. `hideCardDelete` drops the destructive item, `cardMenu={false}` removes the menu, and `cardActions` adds your own controls.

Two interaction guards come with it: a press on an action doesn't start a drag, and the board no longer intercepts keystrokes aimed at a control inside a card — without that, Space on the menu button would lift the card instead of opening the menu.

Visual refinement throughout — card padding and hover elevation, a pill for the column count, a dashed empty state, a warning-toned WIP overflow — entirely from `--ds-*` tokens. The dragged card now reads through elevation and border rather than the flat `opacity: 0.6` it used before, which removes this component's only dependence on the unmapped opacity scale (`docs/TOKEN_AUDIT.md` B2). Exactly one raw value survives in the Kanban CSS, commented: the column's `min-width`, component-intrinsic geometry with no matching token since `variables.css` maps no sizing scale. The drag threshold is likewise a bare number in TS — it's a property of human hands, not of the design language.

`KanbanCard` gains an `actions` slot, positioned outside the flow so a custom `renderCard` face keeps its actions without laying them out itself.
