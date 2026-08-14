---
'@mellon-design/react': minor
---

Make the Kanban board AI-native: `KanbanBoard` gains `aiPrompt`, backed by `KanbanPromptBar`, `KanbanChangePreview`, `useKanbanCommands`, `kanbanSnapshot` and `parseKanbanResolution`.

This is the library's first AI affordance that **changes structured state** instead of producing text. Everything shipped before it turns the model's `string` into prose (`aiExplain`), a text field's value (`aiRewrite`, `aiSearch`) or an answer about data (`aiTableQuery`); driving a board by prompt needs typed operations against identified entities, which is a genuinely new capability.

**The vocabulary is ours, the transport is yours.** `KanbanCommand` and its validator live in the library; `resolveCommands` is consumer-owned — tool-calling, JSON mode, a server round-trip, whatever you already run. `AIClient` was deliberately not widened: 26 AI-enhanced components depend on that two-method contract, and structured output is a Kanban-local concern. Omit the resolver and the board falls back to `AIClient.complete` plus `parseKanbanResolution`, so every existing client keeps working.

**Responses are classified by blast radius**, because handling them uniformly fails in both directions — it either turns "what's blocked?" into a scary confirmation dialog, or lets "tidy the backlog" rewrite forty cards before anyone sees them:

- no commands → an answer: shown, announced, relevant cards highlighted, board untouched
- one non-destructive command → applied immediately with an undo `Toast`
- more than one command, or any `delete` → staged in `KanbanChangePreview` for per-item review

Validation runs on **every** path, including your own `resolveCommands` — a model that hallucinated a card id is not more trustworthy for having come through someone else's transport. Invalid commands are dropped and shown with their reason rather than thrown or half-applied.

Two behaviours are deliberate rather than incidental. Unparseable prose becomes a `message`, not an error: a model answering "what's blocked?" in plain English has done the right thing, and the failure mode of the alternative (the user sees an error and the board is untouched) is the safe direction anyway. And `@` in the prompt bar resolves a card to its **id** client-side via `useFloatingListPicker`, which removes the single hardest thing we'd otherwise ask a model to get right — two similar titles and a confident guess between them.

`aiPrompt` renders nothing unless there's a way to resolve a prompt: an ancestor `AIProvider` **or** a `resolveCommands`. With neither, the board's markup is byte-identical to the non-AI rendering — there's a test asserting exactly that, and a Storybook story showing it. Note this widens the usual rule slightly: supplying a resolver is itself an explicit opt-in, so it enables the bar without a provider mounted.

Undo uses `ToastContext` read directly rather than `useToast`, which throws outside its provider — an undo affordance must never be the reason a board can't mount. Without a `ToastProvider` the change still applies and is announced through the board's live region.

The prompt payload is budgeted and deterministically truncated (`kanbanSnapshot`): every column always appears, since a column a model can't see is a destination it can't use, and cards are dropped from the end with the omitted count stated in the prompt.

Also adds `highlighted` to `KanbanCard`, which pairs its ring with visually-hidden text so the annotation isn't carried by colour alone.
