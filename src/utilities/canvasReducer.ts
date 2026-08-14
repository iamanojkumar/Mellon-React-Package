/**
 * The canvas scene model and its one pure state transition.
 *
 * Same shape as `kanbanReducer` and for the same reason: pointer drag,
 * keyboard nudge, context menu and (later) AI command are all expressed as
 * `CanvasCommand`s and applied here, so they cannot drift apart on rounding,
 * clamping or cascade rules. Nothing here touches React or the DOM, which
 * matters more on a canvas than anywhere else in this library — jsdom has no
 * layout engine, so this file is where the behaviour has to be testable.
 */

export type CanvasTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

export type CanvasShapeKind = 'rectangle' | 'ellipse' | 'diamond' | 'triangle' | 'parallelogram';

interface CanvasBlockCommon {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /**
   * Overrides what the outline twin and announcements call this block. Each
   * kind derives a sensible default, so this is only for when the content
   * itself doesn't read well as a name.
   */
  label?: string;
  /** Opaque consumer data. Never inspected here. */
  meta?: Record<string, unknown>;
}

export interface CanvasStickyBlock extends CanvasBlockCommon {
  kind: 'sticky';
  text: string;
  /**
   * One of the five semantic roles, not a free colour. A wider note palette
   * needs categorical roles the Foundation hasn't shipped — the same gap that
   * blocks multi-series charts (see `docs/CHART_TOKEN_REQUIREMENTS.md`). Tone
   * never carries meaning alone; the note's text does.
   */
  tone?: CanvasTone;
}

export interface CanvasTextBlock extends CanvasBlockCommon {
  kind: 'text';
  /** Rich text as an HTML string, matching `RichTextEditor`'s value shape. */
  html: string;
}

export interface CanvasImageBlock extends CanvasBlockCommon {
  kind: 'image';
  src: string;
  /** Required, like `Image`'s own `alt` — pass `''` for a decorative image. */
  alt: string;
}

export interface CanvasShapeBlock extends CanvasBlockCommon {
  kind: 'shape';
  shape: CanvasShapeKind;
  text?: string;
  tone?: CanvasTone;
}

export interface CanvasDividerBlock extends CanvasBlockCommon {
  kind: 'divider';
  orientation?: 'horizontal' | 'vertical';
}

export interface CanvasEmbedBlock extends CanvasBlockCommon {
  kind: 'embed';
  /** Renders in a sandboxed iframe. Exactly one of `url`/`html` is used, `url` first. */
  url?: string;
  html?: string;
  /** Required — an iframe with no title is unnavigable by screen reader. */
  title: string;
}

export interface CanvasFrameBlock extends CanvasBlockCommon {
  kind: 'frame';
  title: string;
  tone?: CanvasTone;
}

export interface CanvasCodeBlock extends CanvasBlockCommon {
  kind: 'code';
  code: string;
  /** Shown as a caption. No highlighting — this library ships no tokenizer. */
  language?: string;
}

export interface CanvasTableBlock extends CanvasBlockCommon {
  kind: 'table';
  columns: string[];
  /** Row-major cells. Short rows render as empty cells rather than breaking the grid. */
  rows: string[][];
  caption?: string;
}

export interface CanvasLinkBlock extends CanvasBlockCommon {
  kind: 'link';
  url: string;
  title?: string;
  description?: string;
}

export interface CanvasChecklistItem {
  id: string;
  text: string;
  done?: boolean;
}

export interface CanvasChecklistBlock extends CanvasBlockCommon {
  kind: 'checklist';
  title?: string;
  items: CanvasChecklistItem[];
}

export interface CanvasChartBlock extends CanvasBlockCommon {
  kind: 'chart';
  /** What the chart shows — its caption, and its accessible name. */
  label: string;
  data: { label: string; value: number }[];
  chartType?: 'bar' | 'line';
}

export type CanvasBlockData =
  | CanvasStickyBlock
  | CanvasTextBlock
  | CanvasImageBlock
  | CanvasShapeBlock
  | CanvasDividerBlock
  | CanvasEmbedBlock
  | CanvasFrameBlock
  | CanvasCodeBlock
  | CanvasTableBlock
  | CanvasLinkBlock
  | CanvasChecklistBlock
  | CanvasChartBlock;

export type CanvasBlockKind = CanvasBlockData['kind'];

export type CanvasConnectorVariant = 'straight' | 'orthogonal' | 'curved';
export type CanvasConnectorArrow = 'none' | 'end' | 'both';

export interface CanvasConnectorData {
  id: string;
  /** Block ids. Self-connection is rejected — it has no meaningful path. */
  from: string;
  to: string;
  label?: string;
  variant?: CanvasConnectorVariant;
  arrow?: CanvasConnectorArrow;
}

export interface CanvasScene {
  /** Array order is z-order: later blocks paint on top. */
  blocks: CanvasBlockData[];
  connectors: CanvasConnectorData[];
}

/**
 * A partial of one block kind — distributed over the union rather than
 * `Partial<Omit<CanvasBlockData, …>>`, which collapses to only the keys every
 * kind shares and would make a sticky note's `text` unpatchable.
 *
 * `id` and `kind` are excluded on purpose: changing a block's kind would strand
 * its old kind-specific fields on a shape that no longer declares them.
 */
type DistributePatch<T> = T extends unknown ? Partial<Omit<T, 'id' | 'kind'>> : never;

export type CanvasPatch = DistributePatch<CanvasBlockData>;

export type CanvasCommand =
  | { op: 'create'; block: CanvasBlockData }
  | { op: 'move'; id: string; x: number; y: number }
  | { op: 'resize'; id: string; width: number; height: number }
  | { op: 'update'; id: string; patch: CanvasPatch }
  | { op: 'connect'; connector: CanvasConnectorData }
  | { op: 'delete'; id: string };

export interface CanvasRejectedCommand {
  command: CanvasCommand;
  /** Human-readable and safe to render — the change preview shows these verbatim. */
  reason: string;
}

export interface CanvasApplyResult {
  scene: CanvasScene;
  applied: CanvasCommand[];
  rejected: CanvasRejectedCommand[];
}

/**
 * Smallest a block may be resized to, in canvas units. Component-intrinsic
 * geometry: below this a block has no room for its own affordances, which is a
 * fact about the handles, not a design-language value.
 */
export const MIN_BLOCK_SIZE = 24;

export const EMPTY_CANVAS_SCENE: CanvasScene = { blocks: [], connectors: [] };

export function findCanvasBlock(scene: CanvasScene, id: string): CanvasBlockData | undefined {
  return scene.blocks.find((block) => block.id === id);
}

/** Connectors with either endpoint on `blockId`. */
export function connectorsForBlock(scene: CanvasScene, blockId: string): CanvasConnectorData[] {
  return scene.connectors.filter(
    (connector) => connector.from === blockId || connector.to === blockId,
  );
}

function isFinitePair(a: number, b: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b);
}

function applyOne(scene: CanvasScene, command: CanvasCommand): CanvasScene | string {
  switch (command.op) {
    case 'create': {
      const { block } = command;
      if (!block.id) return 'Block is missing an id';
      if (findCanvasBlock(scene, block.id)) return `Block "${block.id}" already exists`;
      if (!isFinitePair(block.x, block.y)) return `Block "${block.id}" has a non-finite position`;
      if (!isFinitePair(block.width, block.height) || block.width <= 0 || block.height <= 0) {
        return `Block "${block.id}" has a non-positive size`;
      }
      return { ...scene, blocks: [...scene.blocks, block] };
    }

    case 'move': {
      if (!findCanvasBlock(scene, command.id)) return `Unknown block "${command.id}"`;
      if (!isFinitePair(command.x, command.y)) return `Non-finite position for "${command.id}"`;
      return {
        ...scene,
        blocks: scene.blocks.map((block) =>
          block.id === command.id ? { ...block, x: command.x, y: command.y } : block,
        ),
      };
    }

    case 'resize': {
      if (!findCanvasBlock(scene, command.id)) return `Unknown block "${command.id}"`;
      if (!isFinitePair(command.width, command.height)) {
        return `Non-finite size for "${command.id}"`;
      }
      // Clamped rather than rejected: a resize drag continuously produces
      // sub-minimum values as the pointer crosses the edge, and rejecting each
      // one would make the block stutter instead of simply stopping.
      const width = Math.max(MIN_BLOCK_SIZE, command.width);
      const height = Math.max(MIN_BLOCK_SIZE, command.height);
      return {
        ...scene,
        blocks: scene.blocks.map((block) =>
          block.id === command.id ? { ...block, width, height } : block,
        ),
      };
    }

    case 'update': {
      const existing = findCanvasBlock(scene, command.id);
      if (!existing) return `Unknown block "${command.id}"`;
      if (Object.keys(command.patch).length === 0) return `Empty patch for "${command.id}"`;
      return {
        ...scene,
        blocks: scene.blocks.map((block) =>
          // `kind` and `id` are excluded by the type: changing a block's kind
          // would leave its old kind-specific fields behind on a shape that no
          // longer declares them.
          block.id === command.id ? ({ ...block, ...command.patch } as CanvasBlockData) : block,
        ),
      };
    }

    case 'connect': {
      const { connector } = command;
      if (!connector.id) return 'Connector is missing an id';
      if (scene.connectors.some((existing) => existing.id === connector.id)) {
        return `Connector "${connector.id}" already exists`;
      }
      if (connector.from === connector.to) return 'A connector cannot join a block to itself';
      if (!findCanvasBlock(scene, connector.from)) return `Unknown block "${connector.from}"`;
      if (!findCanvasBlock(scene, connector.to)) return `Unknown block "${connector.to}"`;
      return { ...scene, connectors: [...scene.connectors, connector] };
    }

    case 'delete': {
      if (findCanvasBlock(scene, command.id)) {
        // Deleting a block takes its connectors with it — an edge to a block
        // that no longer exists has no path to draw and no meaning.
        return {
          blocks: scene.blocks.filter((block) => block.id !== command.id),
          connectors: scene.connectors.filter(
            (connector) => connector.from !== command.id && connector.to !== command.id,
          ),
        };
      }
      if (scene.connectors.some((connector) => connector.id === command.id)) {
        return {
          ...scene,
          connectors: scene.connectors.filter((connector) => connector.id !== command.id),
        };
      }
      return `Unknown block or connector "${command.id}"`;
    }
  }
}

/**
 * Applies commands in order, skipping any that don't hold against the scene
 * *as of that point in the sequence* — so a `create` followed by a `connect`
 * naming the block it just made both succeed, while a command referencing
 * something that never existed is dropped rather than throwing.
 *
 * Dropping instead of throwing is what lets a language model drive this safely:
 * one hallucinated id must not take down the scene or leave it half-mutated.
 */
export function applyCanvasCommands(
  scene: CanvasScene,
  commands: CanvasCommand[],
): CanvasApplyResult {
  const applied: CanvasCommand[] = [];
  const rejected: CanvasRejectedCommand[] = [];

  const next = commands.reduce<CanvasScene>((current, command) => {
    const result = applyOne(current, command);
    if (typeof result === 'string') {
      rejected.push({ command, reason: result });
      return current;
    }
    applied.push(command);
    return result;
  }, scene);

  return { scene: next, applied, rejected };
}

/** What `applyCanvasCommands` would do, without keeping the resulting scene. */
export function validateCanvasCommands(
  scene: CanvasScene,
  commands: CanvasCommand[],
): { applied: CanvasCommand[]; rejected: CanvasRejectedCommand[] } {
  const { applied, rejected } = applyCanvasCommands(scene, commands);
  return { applied, rejected };
}

/** The text the outline twin, announcements and AI prompts use to name a block. */
export function canvasBlockLabel(block: CanvasBlockData): string {
  if (block.label) return block.label;
  switch (block.kind) {
    case 'sticky':
      return block.text || 'Empty note';
    case 'text':
      // Cheap tag strip: this is a naming heuristic, not sanitization — the
      // value is rendered as text, never as markup.
      return (
        block.html
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim() || 'Empty text'
      );
    case 'image':
      return block.alt || 'Image';
    case 'shape':
      return block.text || block.shape;
    case 'divider':
      return 'Divider';
    case 'embed':
      return block.title;
    case 'frame':
      return block.title;
    case 'code':
      // The first real line names a snippet better than "Code" does — it's
      // usually the signature or the command.
      return (
        block.code
          .split('\n')
          .map((line) => line.trim())
          .find(Boolean) ?? (block.language ? `${block.language} snippet` : 'Code')
      );
    case 'table':
      return (
        block.caption ?? `Table, ${block.columns.length} columns and ${block.rows.length} rows`
      );
    case 'link':
      return block.title || block.url;
    case 'checklist': {
      const done = block.items.filter((item) => item.done).length;
      // The count is part of the name because the outline is where a
      // non-visual reader learns a checklist's state at a glance.
      return `${block.title || 'Checklist'} — ${done} of ${block.items.length} done`;
    }
    case 'chart':
      return block.label;
  }
}
