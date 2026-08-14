import { canvasBlockLabel, findCanvasBlock } from './canvasReducer';
import type { CanvasBlockData, CanvasCommand, CanvasScene } from './canvasReducer';
import { boundsOf } from './canvasGeometry';
import type { CanvasPoint } from './canvasGeometry';
import type { CanvasSnapshot } from './canvasSnapshot';

/**
 * Affinity mapping: the model decides *which notes belong together*, and this
 * file decides *where they go*.
 *
 * That split is the whole design. Asking a model for coordinates is asking it
 * to do the one part of this it is worst at — a grouping of thirty notes comes
 * back overlapping, off-grid, or stacked at the origin — while the part it is
 * genuinely good at is reading thirty notes and noticing that four of them are
 * all about onboarding. So the response carries titles and member ids and
 * nothing else, and the geometry below is pure, deterministic and unit-testable
 * without a layout engine. It is the same move the prompt bar makes when `@`
 * resolves a block to its id client-side.
 */

/** One proposed cluster: a name, and the blocks that belong to it. */
export interface CanvasClusterGroup {
  title: string;
  blockIds: string[];
}

export interface CanvasClusterResolution {
  groups: CanvasClusterGroup[];
  /** Prose — an explanation, or a refusal when nothing groups cleanly. Rendered verbatim. */
  message?: string;
}

/** A group or member the canvas refused to lay out, and why. */
export interface CanvasClusterDrop {
  reason: string;
}

export interface CanvasClusterLayoutOptions {
  /** Canvas units between members inside a frame. Defaults to 24. */
  gap?: number;
  /** Units between a frame's edge and its members. Defaults to 32. */
  padding?: number;
  /** Extra top padding keeping members clear of the frame's own title. Defaults to 24. */
  headerSpace?: number;
  /** Units between adjacent frames. Defaults to 64. */
  frameGap?: number;
  /** Most columns of members inside one frame. Defaults to 4. */
  maxColumns?: number;
  /** Top-left of the band of frames. Defaults to clear of everything that isn't moving. */
  origin?: CanvasPoint;
  /** Prefix for generated frame ids. Defaults to `'cluster'`. */
  idPrefix?: string;
}

export interface CanvasClusterOptions extends CanvasClusterLayoutOptions {
  /** Groups to ask for. Prompt guidance only — a resolver may ignore it. */
  maxGroups?: number;
}

/**
 * Layout constants in canvas units. Interaction geometry, not design values:
 * they describe how far apart two absolutely-positioned notes must sit to read
 * as separate, which no spacing token expresses.
 */
export const DEFAULT_CLUSTER_LAYOUT: Required<
  Omit<CanvasClusterLayoutOptions, 'origin' | 'idPrefix'>
> & {
  idPrefix: string;
} = {
  gap: 24,
  padding: 32,
  headerSpace: 24,
  frameGap: 64,
  maxColumns: 4,
  idPrefix: 'cluster',
};

export const DEFAULT_CLUSTER_MAX_GROUPS = 8;

/**
 * A block is a candidate for clustering when it carries **authored prose** — a
 * note, a labelled shape, rich text, a saved link, a checklist.
 *
 * Frames are excluded because a frame is a container: clustering one would nest
 * regions whose membership is geometric, so a note could end up inside two
 * frames at once with no way to say which claims it. Dividers, images, charts,
 * tables, embeds and code are excluded because there is nothing to read an
 * affinity *from* — a snippet or a series clusters by what it is, not by what
 * it says, and grouping them would be guessing from position, which the user
 * can already see.
 */
export function isClusterCandidate(block: CanvasBlockData): boolean {
  return (
    block.kind === 'sticky' ||
    block.kind === 'shape' ||
    block.kind === 'text' ||
    block.kind === 'link' ||
    block.kind === 'checklist'
  );
}

export function clusterCandidates(scene: CanvasScene): CanvasBlockData[] {
  return scene.blocks.filter(isClusterCandidate);
}

/**
 * Drops what can't be laid out and reports why — the same drop-and-report
 * contract `applyCanvasCommands` keeps, applied one level up where the failure
 * is semantic (a hallucinated id, a note claimed twice) rather than structural.
 *
 * A block claimed by two groups goes to the **first**: a note can only be in
 * one place, and picking the earlier mention is at least predictable, where
 * picking the "best" one would need a judgement this layer can't make.
 */
export function normalizeCanvasClusters(
  scene: CanvasScene,
  groups: CanvasClusterGroup[],
  candidateIds?: string[],
): { groups: CanvasClusterGroup[]; dropped: CanvasClusterDrop[] } {
  const allowed = candidateIds
    ? new Set(candidateIds)
    : new Set(clusterCandidates(scene).map((block) => block.id));

  const claimed = new Set<string>();
  const dropped: CanvasClusterDrop[] = [];
  const kept: CanvasClusterGroup[] = [];

  for (const group of groups) {
    const title = group.title?.trim();
    if (!title) {
      dropped.push({ reason: 'A group with no title was ignored.' });
      continue;
    }

    const blockIds: string[] = [];
    for (const id of group.blockIds ?? []) {
      const block = findCanvasBlock(scene, id);
      if (!block) {
        dropped.push({ reason: `“${title}” referenced unknown block “${id}”.` });
        continue;
      }
      if (!allowed.has(id)) {
        dropped.push({
          reason: `“${canvasBlockLabel(block)}” can't be grouped, so “${title}” left it out.`,
        });
        continue;
      }
      if (claimed.has(id)) {
        dropped.push({
          reason: `“${canvasBlockLabel(block)}” was already grouped, so “${title}” left it out.`,
        });
        continue;
      }
      claimed.add(id);
      blockIds.push(id);
    }

    if (blockIds.length === 0) {
      dropped.push({ reason: `“${title}” had no blocks left, so it was skipped.` });
      continue;
    }

    kept.push({ title, blockIds });
  }

  return { groups: kept, dropped };
}

/** Grid shape for `count` members: as square as possible, never wider than `maxColumns`. */
function gridShape(count: number, maxColumns: number): { columns: number; rows: number } {
  const columns = Math.max(1, Math.min(maxColumns, Math.ceil(Math.sqrt(count))));
  return { columns, rows: Math.ceil(count / columns) };
}

/** First `prefix-n` not already taken, so a re-run can't collide with its own last one. */
function nextFrameId(taken: Set<string>, prefix: string): string {
  let index = 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  const id = `${prefix}-${index}`;
  taken.add(id);
  return id;
}

/**
 * Turns validated groups into the commands that realise them: one `create` per
 * frame, then a `move` per member into its cell.
 *
 * Sizes are never changed. A note the user deliberately made large stays large;
 * the grid uses the widest and tallest member as its cell so nothing overlaps,
 * which costs some whitespace and keeps every block exactly as its author left
 * it.
 *
 * The band of frames is placed clear of **everything that isn't moving**, so
 * blocks the model left ungrouped can't end up buried under a new frame. When
 * every block is being clustered there is nothing to clear, and the band starts
 * at the origin the caller gave (or `0,0`).
 */
export function clusterCommands(
  scene: CanvasScene,
  groups: CanvasClusterGroup[],
  options?: CanvasClusterLayoutOptions,
): CanvasCommand[] {
  const gap = options?.gap ?? DEFAULT_CLUSTER_LAYOUT.gap;
  const padding = options?.padding ?? DEFAULT_CLUSTER_LAYOUT.padding;
  const headerSpace = options?.headerSpace ?? DEFAULT_CLUSTER_LAYOUT.headerSpace;
  const frameGap = options?.frameGap ?? DEFAULT_CLUSTER_LAYOUT.frameGap;
  const maxColumns = options?.maxColumns ?? DEFAULT_CLUSTER_LAYOUT.maxColumns;
  const idPrefix = options?.idPrefix ?? DEFAULT_CLUSTER_LAYOUT.idPrefix;

  if (groups.length === 0) return [];

  const moving = new Set(groups.flatMap((group) => group.blockIds));
  const staying = scene.blocks.filter((block) => !moving.has(block.id));
  const stayingBounds = boundsOf(staying);

  const origin =
    options?.origin ??
    (stayingBounds
      ? { x: stayingBounds.x, y: stayingBounds.y + stayingBounds.height + frameGap }
      : { x: 0, y: 0 });

  const takenIds = new Set(scene.blocks.map((block) => block.id));
  const commands: CanvasCommand[] = [];
  let cursorX = origin.x;

  for (const group of groups) {
    const members = group.blockIds
      .map((id) => findCanvasBlock(scene, id))
      .filter((block): block is CanvasBlockData => block !== undefined);
    if (members.length === 0) continue;

    const cellWidth = Math.max(...members.map((block) => block.width));
    const cellHeight = Math.max(...members.map((block) => block.height));
    const { columns, rows } = gridShape(members.length, maxColumns);

    const frameWidth = padding * 2 + columns * cellWidth + (columns - 1) * gap;
    const frameHeight = padding * 2 + headerSpace + rows * cellHeight + (rows - 1) * gap;

    commands.push({
      op: 'create',
      block: {
        id: nextFrameId(takenIds, idPrefix),
        kind: 'frame',
        title: group.title,
        x: cursorX,
        y: origin.y,
        width: frameWidth,
        height: frameHeight,
      },
    });

    members.forEach((block, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      commands.push({
        op: 'move',
        id: block.id,
        x: cursorX + padding + column * (cellWidth + gap),
        y: origin.y + padding + headerSpace + row * (cellHeight + gap),
      });
    });

    cursorX += frameWidth + frameGap;
  }

  return commands;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Pulls the JSON out of a ```json fence, or returns the text unchanged. */
function unfence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fenced?.[1] ?? text).trim();
}

/**
 * Parses a model's raw text into groups.
 *
 * Unparseable text becomes a `message` with no groups, exactly as
 * `parseCanvasResolution` does — "these notes don't share a theme" is a
 * legitimate answer to a clustering request, and the safe direction for a
 * genuinely broken response is prose the user reads while nothing moves.
 */
export function parseCanvasClusterResolution(text: string): CanvasClusterResolution {
  const trimmed = unfence(text);
  if (!trimmed) return { groups: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { groups: [], message: text.trim() };
  }

  if (!isRecord(parsed)) return { groups: [], message: text.trim() };

  const rawGroups = Array.isArray(parsed['groups']) ? parsed['groups'] : [];
  const groups = rawGroups.flatMap((value): CanvasClusterGroup[] => {
    if (!isRecord(value)) return [];
    const title = typeof value['title'] === 'string' ? value['title'] : '';
    const blockIds = Array.isArray(value['blockIds'])
      ? value['blockIds'].filter((id): id is string => typeof id === 'string')
      : [];
    if (!title || blockIds.length === 0) return [];
    return [{ title, blockIds }];
  });

  const message = typeof parsed['message'] === 'string' ? parsed['message'] : undefined;

  return { groups, ...(message ? { message } : {}) };
}

/**
 * The default clustering instruction.
 *
 * Says nothing about coordinates on purpose — see the note at the top of this
 * file. It also names every candidate exactly once, so "put each note in at
 * most one group" is a rule the model can actually follow rather than one we
 * only enforce afterwards.
 */
export function buildCanvasClusterPrompt(
  snapshot: CanvasSnapshot,
  options?: { candidateIds?: string[]; maxGroups?: number; instruction?: string },
): string {
  const maxGroups = options?.maxGroups ?? DEFAULT_CLUSTER_MAX_GROUPS;
  const candidates = options?.candidateIds
    ? snapshot.blocks.filter((block) => options.candidateIds?.includes(block.id))
    : snapshot.blocks;

  return [
    'You are grouping the notes on a visual canvas by theme (affinity mapping).',
    'Respond with a single JSON object and nothing else.',
    '',
    'Shape:',
    '{"groups": [{"title": "Theme name", "blockIds": ["id", "id"]}], "message": "optional prose"}',
    '',
    'Rules:',
    '- Group by what the text means, not by where the blocks currently sit.',
    `- Produce at most ${maxGroups} groups, each with a short, specific title.`,
    '- Put each block in at most one group. Leave a block out entirely if it fits nowhere.',
    '- Use only the exact ids listed below. Never invent an id or use a label as one.',
    '- Do not return positions or sizes. Placement is handled for you.',
    '- If the blocks share no meaningful themes, return no groups and say so in "message".',
    snapshot.truncated
      ? `- ${snapshot.omittedBlockCount} block(s) are not shown. Say so if it affects the grouping.`
      : '',
    options?.instruction ? `- ${options.instruction}` : '',
    '',
    'Blocks:',
    JSON.stringify(
      candidates.map((block) => ({ id: block.id, kind: block.kind, label: block.label })),
    ),
  ]
    .filter(Boolean)
    .join('\n');
}
