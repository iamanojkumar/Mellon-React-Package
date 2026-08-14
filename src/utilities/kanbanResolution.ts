import type { KanbanCard, KanbanCardStatus, KanbanCommand } from './kanbanReducer';

/**
 * What one prompt resolves to. Deliberately allows *no commands at all* —
 * that's the answer to a question ("what's blocked?") and to an ambiguous
 * request alike, and a pipeline that can only express mutations would have to
 * invent one in both cases.
 */
export interface KanbanResolution {
  commands: KanbanCommand[];
  /** Prose answer or clarifying question. Rendered verbatim; never parsed for intent. */
  message?: string;
  /** Cards the answer refers to — highlighted, not modified. */
  highlightCardIds?: string[];
}

const STATUSES: readonly string[] = ['success', 'warning', 'danger'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asIndex(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

function parseCard(value: unknown): KanbanCard | undefined {
  if (!isRecord(value)) return undefined;
  const id = asString(value['id']);
  const title = asString(value['title']);
  if (!id || !title) return undefined;

  const status = asString(value['status']);
  const assignee = isRecord(value['assignee']) ? value['assignee'] : undefined;
  const assigneeId = assignee ? asString(assignee['id']) : undefined;
  const assigneeName = assignee ? asString(assignee['name']) : undefined;

  return {
    id,
    title,
    ...(asString(value['description']) ? { description: asString(value['description']) } : {}),
    ...(status && STATUSES.includes(status) ? { status: status as KanbanCardStatus } : {}),
    ...(asStringArray(value['tags']) ? { tags: asStringArray(value['tags']) } : {}),
    ...(assigneeId && assigneeName ? { assignee: { id: assigneeId, name: assigneeName } } : {}),
  };
}

function parsePatch(value: unknown): Partial<Omit<KanbanCard, 'id'>> | undefined {
  if (!isRecord(value)) return undefined;
  const patch: Partial<Omit<KanbanCard, 'id'>> = {};

  const title = asString(value['title']);
  if (title) patch.title = title;

  const description = asString(value['description']);
  if (description) patch.description = description;

  const status = asString(value['status']);
  if (status && STATUSES.includes(status)) patch.status = status as KanbanCardStatus;

  const tags = asStringArray(value['tags']);
  if (tags) patch.tags = tags;

  const assignee = isRecord(value['assignee']) ? value['assignee'] : undefined;
  const assigneeId = assignee ? asString(assignee['id']) : undefined;
  const assigneeName = assignee ? asString(assignee['name']) : undefined;
  if (assigneeId && assigneeName) patch.assignee = { id: assigneeId, name: assigneeName };

  // An `update` that patches nothing is noise, not an operation.
  return Object.keys(patch).length > 0 ? patch : undefined;
}

/**
 * Shape-checks one command. Returns `undefined` rather than throwing — a
 * single malformed entry in an otherwise good batch shouldn't discard the
 * whole response.
 *
 * This is only structural. Whether the ids actually exist is
 * `applyKanbanCommands`'s job, which knows the board; checking it twice in two
 * places is how the two checks drift apart.
 */
export function parseKanbanCommand(value: unknown): KanbanCommand | undefined {
  if (!isRecord(value)) return undefined;

  switch (value['op']) {
    case 'move': {
      const cardId = asString(value['cardId']);
      const toColumnId = asString(value['toColumnId']);
      if (!cardId || !toColumnId) return undefined;
      const index = asIndex(value['index']);
      return { op: 'move', cardId, toColumnId, ...(index === undefined ? {} : { index }) };
    }
    case 'create': {
      const columnId = asString(value['columnId']);
      const card = parseCard(value['card']);
      if (!columnId || !card) return undefined;
      const index = asIndex(value['index']);
      return { op: 'create', columnId, card, ...(index === undefined ? {} : { index }) };
    }
    case 'update': {
      const cardId = asString(value['cardId']);
      const patch = parsePatch(value['patch']);
      if (!cardId || !patch) return undefined;
      return { op: 'update', cardId, patch };
    }
    case 'delete': {
      const cardId = asString(value['cardId']);
      if (!cardId) return undefined;
      return { op: 'delete', cardId };
    }
    default:
      return undefined;
  }
}

/** Pulls the JSON out of a ```json fence, or returns the text unchanged. */
function unfence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? text).trim();
}

/**
 * Parses a model's raw text into a resolution.
 *
 * **Unparseable text becomes a `message`, not an error.** A model answering
 * "what's blocked?" in plain prose has done the right thing, and the query
 * path wants exactly that — so prose is treated as an answer rather than a
 * failure. The cost is that a genuinely broken response also surfaces as a
 * message, which is the safe direction: the user sees the model's words and
 * nothing touches the board.
 *
 * Only used on the fallback path. A consumer supplying `resolveCommands`
 * produces a `KanbanResolution` directly and never comes through here.
 */
export function parseKanbanResolution(text: string): KanbanResolution {
  const trimmed = unfence(text);
  if (!trimmed) return { commands: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { commands: [], message: text.trim() };
  }

  if (!isRecord(parsed)) return { commands: [], message: text.trim() };

  const rawCommands = Array.isArray(parsed['commands']) ? parsed['commands'] : [];
  const commands = rawCommands
    .map(parseKanbanCommand)
    .filter((command): command is KanbanCommand => command !== undefined);

  const message = asString(parsed['message']);
  const highlightCardIds = asStringArray(parsed['highlightCardIds']);

  return {
    commands,
    ...(message ? { message } : {}),
    ...(highlightCardIds ? { highlightCardIds } : {}),
  };
}
