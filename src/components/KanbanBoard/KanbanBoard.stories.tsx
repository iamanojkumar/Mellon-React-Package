import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { KanbanBoard } from './KanbanBoard';
import type { KanbanBoardData } from '../../utilities/kanbanReducer';
import { Text } from '../Text/Text';
import { Stack } from '../Stack/Stack';
import { Button } from '../Button/Button';
import { AIProvider } from '../../providers/AIProvider';
import { ToastProvider } from '../../providers/ToastProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof KanbanBoard> = {
  title: 'Board/KanbanBoard',
  component: KanbanBoard,
};

export default meta;
type Story = StoryObj<typeof KanbanBoard>;

const board: KanbanBoardData = {
  columns: [
    { id: 'backlog', title: 'Backlog', cardIds: ['c1', 'c2'] },
    { id: 'progress', title: 'In progress', cardIds: ['c3'], wipLimit: 2 },
    { id: 'review', title: 'In review', cardIds: ['c4'] },
    { id: 'done', title: 'Done', cardIds: [] },
  ],
  cards: {
    c1: {
      id: 'c1',
      title: 'Audit chart tokens',
      description: 'Check which roles the Foundation still owes us.',
      tags: ['tokens'],
    },
    c2: {
      id: 'c2',
      title: 'Fix login redirect',
      status: 'danger',
      tags: ['bug'],
      assignee: { id: 'u1', name: 'Ana Diaz' },
    },
    c3: {
      id: 'c3',
      title: 'Ship release 0.2',
      status: 'warning',
      assignee: { id: 'u2', name: 'Ravi Mehta' },
    },
    c4: {
      id: 'c4',
      title: 'Write migration guide',
      status: 'success',
      tags: ['docs'],
    },
  },
};

export const Default: Story = {
  args: { defaultBoard: board, 'aria-label': 'Sprint board' },
};

/**
 * Keyboard is a first-class move path, not a fallback. Tab to a card, then
 * Space to pick it up, arrows to move it, Space to drop, Escape to cancel.
 */
export const KeyboardMoves: Story = {
  render: () => (
    <Stack gap="md">
      <Text size="sm">
        Tab to a card, then: <strong>Space</strong> picks it up, <strong>arrows</strong> move it,{' '}
        <strong>Space</strong> drops it, <strong>Escape</strong> cancels. Without a lifted card,
        arrows just move focus.
      </Text>
      <KanbanBoard defaultBoard={board} aria-label="Sprint board" />
    </Stack>
  ),
};

/** A column past its WIP limit says so in words — the border colour is reinforcement, not the signal. */
export const OverWipLimit: Story = {
  args: {
    'aria-label': 'Sprint board',
    defaultBoard: {
      ...board,
      columns: board.columns.map((column) =>
        column.id === 'progress' ? { ...column, cardIds: ['c1', 'c2', 'c3'], wipLimit: 2 } : column,
      ),
    },
  },
};

/** Controlled: the parent owns the board and decides whether to accept each change. */
export const Controlled: Story = {
  render: function ControlledBoard() {
    const [value, setValue] = useState<KanbanBoardData>(board);
    const [log, setLog] = useState<string[]>([]);

    return (
      <Stack gap="md">
        <KanbanBoard
          board={value}
          onBoardChange={setValue}
          onCommand={(command) =>
            setLog((entries) => [
              `${command.op}${'cardId' in command ? ` ${command.cardId}` : ''}`,
              ...entries,
            ])
          }
          aria-label="Sprint board"
        />
        <Text size="sm" color="secondary">
          {log.length === 0 ? 'No moves yet.' : `Commands: ${log.slice(0, 5).join(', ')}`}
        </Text>
      </Stack>
    );
  },
};

/** `renderCard` replaces the face; the board keeps ownership of focus and dragging. */
export const CustomCardFace: Story = {
  args: {
    defaultBoard: board,
    'aria-label': 'Sprint board',
    renderCard: (card) => (
      <Stack gap="xs">
        <Text size="sm" weight="bold">
          {card.title}
        </Text>
        <Text size="xs" color="secondary">
          {card.tags?.join(' · ') ?? 'untagged'}
        </Text>
      </Stack>
    ),
  },
};

/**
 * Every card carries an overflow menu. It's the only *discoverable* pointer
 * affordance — dragging advertises nothing, and on touch it's behind a long
 * press. Each item emits the same command a drag would.
 */
export const CardActions: Story = {
  args: { defaultBoard: board, 'aria-label': 'Sprint board' },
};

/** `hideCardDelete` keeps the move targets but drops the destructive item. */
export const CardActionsWithoutDelete: Story = {
  args: { defaultBoard: board, hideCardDelete: true, 'aria-label': 'Sprint board' },
};

/** Your own actions sit before the menu; `cardMenu={false}` removes the built-in one. */
export const CustomCardActions: Story = {
  args: {
    defaultBoard: board,
    'aria-label': 'Sprint board',
    cardMenu: false,
    cardActions: (card) => (
      <Button size="sm" variant="ghost" onClick={() => alert(`Open ${card.title}`)}>
        Open
      </Button>
    ),
  },
};

/** Read-only board: drag and keyboard moves are blocked, but it stays readable and focusable. */
export const Disabled: Story = {
  args: { defaultBoard: board, disabled: true, 'aria-label': 'Sprint board' },
};

/** Empty columns state their emptiness rather than collapsing to nothing. */
export const Empty: Story = {
  args: {
    'aria-label': 'Sprint board',
    defaultBoard: {
      columns: [
        { id: 'todo', title: 'To do', cardIds: [] },
        { id: 'done', title: 'Done', cardIds: [] },
      ],
      cards: {},
    },
  },
};

/**
 * A deterministic stand-in for a real model — this library never bundles a
 * vendor SDK, key or `fetch` call. It keys off the prompt so each story below
 * exercises a different branch of the pipeline.
 */
const mockClient: AIClient = {
  complete: async ({ prompt }) => {
    // Match on the user's own words only. `buildKanbanPrompt` appends them
    // after a "Request:" line, behind the serialized board — keying off the
    // whole prompt would match column titles instead (a board with an "In
    // review" column makes every prompt look like it says "review").
    const request = (prompt.split('Request:').pop() ?? prompt).toLowerCase();

    if (request.includes('blocked')) {
      return JSON.stringify({
        commands: [],
        message: 'One card is blocked: “Fix login redirect”.',
        highlightCardIds: ['c2'],
      });
    }
    if (request.includes('subtask') || request.includes('break')) {
      return JSON.stringify({
        commands: [
          { op: 'create', columnId: 'backlog', card: { id: 'n1', title: 'Draft token list' } },
          { op: 'create', columnId: 'backlog', card: { id: 'n2', title: 'Check dark theme' } },
          { op: 'create', columnId: 'backlog', card: { id: 'n3', title: 'File Foundation issue' } },
        ],
        message: 'I split the audit into three subtasks.',
      });
    }
    if (request.includes('tidy') || request.includes('clean')) {
      return JSON.stringify({
        commands: [
          { op: 'update', cardId: 'c1', patch: { status: 'warning' } },
          { op: 'move', cardId: 'c2', toColumnId: 'progress', index: 0 },
          { op: 'delete', cardId: 'c4' },
        ],
        message: 'Flagged one, promoted one, and removed a duplicate.',
      });
    }
    if (request.includes('review')) {
      return JSON.stringify({
        commands: [{ op: 'move', cardId: 'c2', toColumnId: 'review' }],
      });
    }
    if (request.includes('discussed') || request.includes('thing')) {
      return JSON.stringify({
        commands: [],
        message: 'Which item did you mean? Name the card or describe the work and I will add it.',
      });
    }
    return JSON.stringify({
      commands: [],
      message: 'Try “move the login fix to In review”, “what is blocked?”, or “tidy the backlog”.',
    });
  },
};

/**
 * The AI-native board. Every prompt runs the same pipeline — resolve,
 * validate, then classify by blast radius:
 *
 * - **“what is blocked?”** — a question. Highlights, changes nothing.
 * - **“move the login fix to In review”** — one non-destructive change.
 *   Applies straight away with an undo toast.
 * - **“break the audit into subtasks”** — three creates. Staged for review.
 * - **“tidy the backlog”** — a batch including a delete. Always staged.
 * - **“add a card for the thing we discussed”** — ambiguous. Asks instead of
 *   inventing a card.
 */
export const AIPrompt: Story = {
  render: () => (
    <ToastProvider>
      <AIProvider client={mockClient}>
        <Stack gap="md">
          <Text size="sm">
            Try: <strong>what is blocked?</strong> ·{' '}
            <strong>move the login fix to In review</strong> ·{' '}
            <strong>break the audit into subtasks</strong> · <strong>tidy the backlog</strong> ·{' '}
            <strong>add a card for the thing we discussed</strong>
          </Text>
          <KanbanBoard defaultBoard={board} aiPrompt aria-label="Sprint board" />
        </Stack>
      </AIProvider>
    </ToastProvider>
  ),
};

/**
 * The load-bearing rule, made visible: `aiPrompt` is set here but no
 * `AIProvider` is mounted, so the board renders markup byte-identical to
 * `Default` — inert, not broken.
 */
export const AIPromptWithoutProvider: Story = {
  args: { defaultBoard: board, aiPrompt: true, 'aria-label': 'Sprint board' },
};

/**
 * `resolveCommands` replaces the text round-trip entirely — this is where a
 * real app would call its own tool-calling endpoint. It also enables the
 * prompt bar on its own, with no `AIProvider`. Commands are still validated
 * against the board, so the hallucinated id below is reported, not applied.
 */
export const CustomResolver: Story = {
  render: () => (
    <KanbanBoard
      defaultBoard={board}
      aiPrompt
      aria-label="Sprint board"
      resolveCommands={async ({ prompt }) => ({
        commands: [
          { op: 'move', cardId: 'c1', toColumnId: 'done' },
          { op: 'move', cardId: 'not-a-real-card', toColumnId: 'done' },
        ],
        message: `Resolved locally, no model involved. You asked: “${prompt}”.`,
      })}
    />
  ),
};
