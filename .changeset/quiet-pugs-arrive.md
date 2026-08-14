---
'@mellon-design/react': minor
---

Add the Kanban board — `KanbanBoard`, `KanbanColumn` and `KanbanCard`, plus the pure `applyKanbanCommands` reducer behind them.

This is the first phase of an AI-native board: the board itself, with **no AI at all**. That ordering is deliberate rather than incidental. Every AI affordance in this library is inert whenever no `AIProvider` is mounted, so a prompt bar can never be the accessibility story for a board — the board has to be complete on its own first, and this phase is what makes that true by construction.

The consumer owns the data (`KanbanBoardData`: `columns` plus a normalized `cards` record) and the board emits `KanbanCommand`s rather than mutating anything, the same "component stays dumb, consumer owns state" split as `DataGrid`/`FileUpload`. Card order lives on the column's `cardIds`, which makes a move a list splice.

Both move paths — pointer drag and keyboard — go through the same pure reducer, so they can't drift apart on index semantics. Keyboard moves are first-class: Space/Enter picks a card up, arrows move it, Space/Enter drops it, Escape puts it back exactly where it started, and every step is announced through a live region. Moving a card across columns re-parents its element and would otherwise drop focus to `<body>`, stranding the user after one arrow press, so the lifted card is re-focused after each applied move.

`applyKanbanCommands` validates as it goes, against the board as of that point in the sequence — a `create` followed by a `move` of the card it just created both succeed, while a command naming a card that never existed is dropped and reported rather than throwing or half-mutating the board. That behaviour exists for the AI layer that comes next: a single hallucinated id must not be able to corrupt a board.

Two smaller decisions worth knowing. `wipLimit` is advisory — an over-limit column says so in words but the drop is never blocked, because refusing it would strand a card mid-move with no way to finish. And a card's `status` renders its label as visible text through `Badge` rather than as a bare coloured dot, so status colour is never the sole carrier of meaning; `statusLabels` overrides the wording.

Drag physics remain unverifiable in jsdom (no layout engine, no pointer capture), so the drag path is covered by `pnpm test:storybook` while the reducer and the whole keyboard contract are unit-tested.

Exports `KanbanBoardData`, `KanbanColumnData`, `KanbanCommand`, `KanbanCardData`, `KanbanCardStatus`, `KanbanAssignee`, `KanbanApplyResult`, `KanbanRejectedCommand`, `applyKanbanCommands`, `validateKanbanCommands`, `findColumnOfCard` and `isOverWipLimit`.
