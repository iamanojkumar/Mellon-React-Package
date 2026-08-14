import type { CanvasScene } from './canvasReducer';
import { canvasBlockLabel } from './canvasReducer';
import { boundsOf, outlineOrder } from './canvasGeometry';
import type { CanvasRect } from './canvasGeometry';

/**
 * The scene, reduced to what a language model needs to reason about it.
 *
 * Unlike the Kanban snapshot, **geometry is content here**, not decoration: on
 * a canvas "put it next to the login note" is only answerable from
 * coordinates. So every block carries its rect, and the scene's overall bounds
 * ride along — without them a model asked to add a block has nowhere sensible
 * to put it and stacks everything at the origin.
 */

export interface CanvasSnapshotBlock {
  id: string;
  kind: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasSnapshotConnector {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface CanvasSnapshot {
  blocks: CanvasSnapshotBlock[];
  connectors: CanvasSnapshotConnector[];
  /** Bounding box of everything present, so new blocks can be placed clear of it. */
  bounds?: CanvasRect;
  truncated: boolean;
  omittedBlockCount: number;
}

export interface CanvasSnapshotOptions {
  /** Blocks to include. Defaults to 120. */
  maxBlocks?: number;
  /** Longest label kept, in characters. Defaults to 120. */
  maxLabelLength?: number;
}

export const DEFAULT_CANVAS_SNAPSHOT_OPTIONS: Required<CanvasSnapshotOptions> = {
  maxBlocks: 120,
  maxLabelLength: 120,
};

/**
 * Serializes the scene in **reading order**, not scene order, and stops once
 * the block budget is spent.
 *
 * Reading order matters because it's the order a person would describe the
 * canvas in, so a truncated snapshot keeps the blocks a human would have
 * mentioned first rather than whichever happened to be created first.
 * Connectors whose endpoints were both cut are dropped too — an edge between
 * two blocks the model can't see is noise it might try to reference.
 */
export function canvasSnapshot(
  scene: CanvasScene,
  options?: CanvasSnapshotOptions,
): CanvasSnapshot {
  const maxBlocks = options?.maxBlocks ?? DEFAULT_CANVAS_SNAPSHOT_OPTIONS.maxBlocks;
  const maxLabelLength = options?.maxLabelLength ?? DEFAULT_CANVAS_SNAPSHOT_OPTIONS.maxLabelLength;

  const ordered = outlineOrder(scene.blocks);
  const kept = ordered.slice(0, Math.max(0, maxBlocks));
  const keptIds = new Set(kept.map((block) => block.id));

  const blocks = kept.map((block) => {
    const label = canvasBlockLabel(block);
    return {
      id: block.id,
      kind: block.kind,
      label: label.length > maxLabelLength ? `${label.slice(0, maxLabelLength)}…` : label,
      x: Math.round(block.x),
      y: Math.round(block.y),
      width: Math.round(block.width),
      height: Math.round(block.height),
    };
  });

  const connectors = scene.connectors
    .filter((connector) => keptIds.has(connector.from) && keptIds.has(connector.to))
    .map((connector) => ({
      id: connector.id,
      from: connector.from,
      to: connector.to,
      ...(connector.label ? { label: connector.label } : {}),
    }));

  const bounds = boundsOf(scene.blocks);
  const omittedBlockCount = ordered.length - kept.length;

  return {
    blocks,
    connectors,
    ...(bounds ? { bounds } : {}),
    truncated: omittedBlockCount > 0,
    omittedBlockCount,
  };
}

/**
 * The default instruction used when the consumer hasn't supplied their own
 * `resolveCommands`.
 *
 * The placement rule is the one that matters most in practice: a model with no
 * guidance about coordinates will happily create ten blocks at `0,0`. Telling
 * it the occupied bounds and asking it to place clear of them is what makes
 * generated content land somewhere usable.
 */
export function buildCanvasPrompt(prompt: string, snapshot: CanvasSnapshot): string {
  const placement = snapshot.bounds
    ? `Existing content occupies x ${Math.round(snapshot.bounds.x)} to ${Math.round(
        snapshot.bounds.x + snapshot.bounds.width,
      )}, y ${Math.round(snapshot.bounds.y)} to ${Math.round(
        snapshot.bounds.y + snapshot.bounds.height,
      )}. Place new blocks clear of that box unless asked otherwise, and never stack them at the same point.`
    : 'The canvas is empty. Start new blocks near 0,0 and lay them out in a readable grid.';

  return [
    'You are operating a visual canvas. Respond with a single JSON object and nothing else.',
    '',
    'Shape:',
    '{"commands": [...], "message": "optional prose", "highlightBlockIds": ["optional ids"]}',
    '',
    'Allowed commands (use the exact ids from the scene below, never labels):',
    '{"op":"create","block":{"id":"...","kind":"sticky","text":"...","x":0,"y":0,"width":160,"height":160}}',
    '{"op":"move","id":"...","x":0,"y":0}',
    '{"op":"resize","id":"...","width":160,"height":160}',
    '{"op":"update","id":"...","patch":{"text":"..."}}',
    '{"op":"connect","connector":{"id":"...","from":"...","to":"...","label":"optional"}}',
    '{"op":"delete","id":"..."}',
    '',
    'Block kinds: sticky (text), shape (shape: rectangle|ellipse|diamond|triangle|parallelogram, text), frame (title), divider, text (html), image (src, alt), embed (title, url), code (code, language), table (columns, rows), link (url, title, description), checklist (title, items: [{text, done}]), chart (label, data: [{label, value}], chartType: bar|line).',
    '',
    'Rules:',
    '- If the request is a question rather than an instruction, return no commands. Answer in "message" and list the relevant blocks in "highlightBlockIds".',
    '- If the request is ambiguous, return no commands and ask for the missing detail in "message". Do not guess.',
    '- Only reference ids that appear below, except ids you create in the same response.',
    `- ${placement}`,
    snapshot.truncated
      ? `- The scene is truncated: ${snapshot.omittedBlockCount} block(s) are not shown. Say so if it affects your answer.`
      : '',
    '',
    'Scene:',
    JSON.stringify({ blocks: snapshot.blocks, connectors: snapshot.connectors }),
    '',
    'Request:',
    prompt,
  ]
    .filter(Boolean)
    .join('\n');
}
