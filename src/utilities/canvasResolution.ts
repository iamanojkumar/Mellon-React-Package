import type {
  CanvasBlockData,
  CanvasCommand,
  CanvasConnectorData,
  CanvasPatch,
  CanvasShapeKind,
  CanvasTone,
} from './canvasReducer';
import type { DocumentAspectRatioPreset } from './documentAspectRatio';

/**
 * What one prompt resolves to. Allows *no commands at all* on purpose — that's
 * both the answer to a question and the response to an ambiguous request, and
 * a pipeline that could only express mutations would have to invent one.
 */
export interface CanvasResolution {
  commands: CanvasCommand[];
  /** Prose answer or clarifying question. Rendered verbatim, never parsed for intent. */
  message?: string;
  /** Blocks the answer refers to — highlighted, not modified. */
  highlightBlockIds?: string[];
  /**
   * The model's own brief account of why it chose these commands (or none) —
   * shown collapsed by default via `ThinkingBlock`. Rendered verbatim like
   * `message`, never parsed for intent: a wrong or missing `thinking` can
   * only make the UI less informative, never change what actually happens
   * to the scene.
   */
  thinking?: string;
}

const TONES: readonly string[] = ['neutral', 'brand', 'success', 'warning', 'danger'];
const SHAPES: readonly string[] = ['rectangle', 'ellipse', 'diamond', 'triangle', 'parallelogram'];
const ASPECT_RATIO_PRESETS: readonly string[] = ['a4', '16:9', '4:3'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : undefined;
}

function asTone(value: unknown): CanvasTone | undefined {
  const tone = asString(value);
  return tone && TONES.includes(tone) ? (tone as CanvasTone) : undefined;
}

/**
 * Default size for a generated block whose kind implies one but whose response
 * omitted it. Interaction geometry, not a design value — a model that forgets
 * a width should still produce something usable rather than a zero-size block
 * the reducer rejects.
 */
const DEFAULT_BLOCK_SIZE: Record<string, { width: number; height: number }> = {
  sticky: { width: 160, height: 160 },
  shape: { width: 160, height: 120 },
  frame: { width: 400, height: 300 },
  divider: { width: 200, height: 24 },
  text: { width: 240, height: 160 },
  image: { width: 240, height: 160 },
  embed: { width: 320, height: 240 },
  code: { width: 320, height: 200 },
  table: { width: 360, height: 200 },
  link: { width: 260, height: 120 },
  checklist: { width: 240, height: 200 },
  chart: { width: 360, height: 240 },
  // A4-proportioned, so a generated document block reads as a page by default.
  document: { width: 280, height: 396 },
};

/**
 * Shape-checks one block. Returns `undefined` rather than throwing so a single
 * malformed entry doesn't discard an otherwise good batch.
 *
 * Kind-specific fields are read per kind, which is what keeps a `sticky` from
 * arriving with a `shape` field that nothing would ever render.
 */
export function parseCanvasBlock(value: unknown): CanvasBlockData | undefined {
  if (!isRecord(value)) return undefined;

  const id = asString(value['id']);
  const kind = asString(value['kind']);
  if (!id || !kind) return undefined;

  const fallback = DEFAULT_BLOCK_SIZE[kind];
  if (!fallback) return undefined;

  const common = {
    id,
    x: asNumber(value['x']) ?? 0,
    y: asNumber(value['y']) ?? 0,
    width: asNumber(value['width']) ?? fallback.width,
    height: asNumber(value['height']) ?? fallback.height,
    ...(asString(value['label']) ? { label: asString(value['label']) } : {}),
  };

  switch (kind) {
    case 'sticky':
      return {
        ...common,
        kind: 'sticky',
        text: asString(value['text']) ?? '',
        ...(asTone(value['tone']) ? { tone: asTone(value['tone']) } : {}),
        ...(asString(value['color']) ? { color: asString(value['color']) } : {}),
      };

    case 'shape': {
      const shape = asString(value['shape']);
      return {
        ...common,
        kind: 'shape',
        shape: shape && SHAPES.includes(shape) ? (shape as CanvasShapeKind) : 'rectangle',
        ...(asString(value['text']) ? { text: asString(value['text']) } : {}),
        ...(asTone(value['tone']) ? { tone: asTone(value['tone']) } : {}),
        ...(asString(value['color']) ? { color: asString(value['color']) } : {}),
      };
    }

    case 'frame': {
      const title = asString(value['title']);
      if (!title) return undefined;
      return {
        ...common,
        kind: 'frame',
        title,
        ...(asTone(value['tone']) ? { tone: asTone(value['tone']) } : {}),
      };
    }

    case 'divider':
      return {
        ...common,
        kind: 'divider',
        orientation: value['orientation'] === 'vertical' ? 'vertical' : 'horizontal',
      };

    case 'text':
      return { ...common, kind: 'text', html: asString(value['html']) ?? '' };

    case 'image': {
      const src = asString(value['src']);
      if (!src) return undefined;
      // `alt` is required by the type and by `Image`; an empty string is the
      // documented way to mark an image decorative, so absence becomes ''.
      return { ...common, kind: 'image', src, alt: asString(value['alt']) ?? '' };
    }

    case 'embed': {
      const title = asString(value['title']);
      // Without a title the iframe is unreachable by screen reader, so a
      // titleless embed is dropped rather than rendered.
      if (!title) return undefined;
      return {
        ...common,
        kind: 'embed',
        title,
        ...(asString(value['url']) ? { url: asString(value['url']) } : {}),
        ...(asString(value['html']) ? { html: asString(value['html']) } : {}),
      };
    }

    case 'code': {
      const code = asString(value['code']);
      if (!code) return undefined;
      return {
        ...common,
        kind: 'code',
        code,
        ...(asString(value['language']) ? { language: asString(value['language']) } : {}),
      };
    }

    case 'table': {
      const columns = asStringArray(value['columns']);
      if (!columns) return undefined;
      // Non-string cells are coerced rather than dropped: a model answering
      // with numbers is right about the data and wrong only about the type.
      const rows = Array.isArray(value['rows'])
        ? value['rows'].flatMap((row) =>
            Array.isArray(row)
              ? [row.map((cell) => (typeof cell === 'string' ? cell : String(cell ?? '')))]
              : [],
          )
        : [];
      return {
        ...common,
        kind: 'table',
        columns,
        rows,
        ...(asString(value['caption']) ? { caption: asString(value['caption']) } : {}),
      };
    }

    case 'link': {
      const url = asString(value['url']);
      if (!url) return undefined;
      return {
        ...common,
        kind: 'link',
        url,
        ...(asString(value['title']) ? { title: asString(value['title']) } : {}),
        ...(asString(value['description']) ? { description: asString(value['description']) } : {}),
      };
    }

    case 'checklist': {
      const items = Array.isArray(value['items'])
        ? value['items'].flatMap((item, index) => {
            if (!isRecord(item)) return [];
            const text = asString(item['text']);
            if (!text) return [];
            // An id is generated when absent — an item is addressed by id when
            // toggled, so without one it could never be ticked off.
            return [
              {
                id: asString(item['id']) ?? `${id}-item-${index}`,
                text,
                ...(item['done'] === true ? { done: true } : {}),
              },
            ];
          })
        : [];
      if (items.length === 0) return undefined;
      return {
        ...common,
        kind: 'checklist',
        items,
        ...(asString(value['title']) ? { title: asString(value['title']) } : {}),
      };
    }

    case 'chart': {
      const label = asString(value['label']);
      if (!label) return undefined;
      const data = Array.isArray(value['data'])
        ? value['data'].flatMap((point) => {
            if (!isRecord(point)) return [];
            const pointLabel = asString(point['label']);
            const pointValue = asNumber(point['value']);
            if (!pointLabel || pointValue === undefined) return [];
            return [{ label: pointLabel, value: pointValue }];
          })
        : [];
      if (data.length === 0) return undefined;
      const chartType = asString(value['chartType']);
      return {
        ...common,
        kind: 'chart',
        label,
        data,
        ...(chartType === 'line' || chartType === 'bar' ? { chartType } : {}),
      };
    }

    case 'document': {
      const pages = asStringArray(value['pages']) ?? [''];
      const layout = asString(value['layout']);
      const rawRatio = value['aspectRatio'];
      const aspectRatio = ASPECT_RATIO_PRESETS.includes(asString(rawRatio) ?? '')
        ? (rawRatio as DocumentAspectRatioPreset)
        : isRecord(rawRatio) &&
            asNumber(rawRatio['width']) !== undefined &&
            asNumber(rawRatio['height']) !== undefined
          ? { width: asNumber(rawRatio['width'])!, height: asNumber(rawRatio['height'])! }
          : undefined;
      return {
        ...common,
        kind: 'document',
        pages,
        ...(aspectRatio ? { aspectRatio } : {}),
        ...(layout === 'two-column' || layout === 'sidebar' ? { layout } : {}),
        ...(asString(value['header']) ? { header: asString(value['header']) } : {}),
        ...(asString(value['footer']) ? { footer: asString(value['footer']) } : {}),
      };
    }

    default:
      return undefined;
  }
}

function parsePatch(value: unknown): CanvasPatch | undefined {
  if (!isRecord(value)) return undefined;
  const patch: Record<string, unknown> = {};

  for (const key of [
    'text',
    'html',
    'title',
    'label',
    'src',
    'alt',
    'url',
    'color',
    'header',
    'footer',
  ] as const) {
    const text = asString(value[key]);
    if (text) patch[key] = text;
  }
  for (const key of ['x', 'y', 'width', 'height'] as const) {
    const number = asNumber(value[key]);
    if (number !== undefined) patch[key] = number;
  }
  const tone = asTone(value['tone']);
  if (tone) patch.tone = tone;
  const shape = asString(value['shape']);
  if (shape && SHAPES.includes(shape)) patch.shape = shape;

  return Object.keys(patch).length > 0 ? (patch as CanvasPatch) : undefined;
}

function parseConnector(value: unknown): CanvasConnectorData | undefined {
  if (!isRecord(value)) return undefined;
  const id = asString(value['id']);
  const from = asString(value['from']);
  const to = asString(value['to']);
  if (!id || !from || !to) return undefined;

  const variant = asString(value['variant']);
  const arrow = asString(value['arrow']);

  return {
    id,
    from,
    to,
    ...(asString(value['label']) ? { label: asString(value['label']) } : {}),
    ...(variant === 'straight' || variant === 'orthogonal' || variant === 'curved'
      ? { variant }
      : {}),
    ...(arrow === 'none' || arrow === 'end' || arrow === 'both' ? { arrow } : {}),
  };
}

/**
 * Structural check only. Whether the ids actually exist is
 * `applyCanvasCommands`'s job, which knows the scene — checking it in two
 * places is how the two checks drift apart.
 */
export function parseCanvasCommand(value: unknown): CanvasCommand | undefined {
  if (!isRecord(value)) return undefined;

  switch (value['op']) {
    case 'create': {
      const block = parseCanvasBlock(value['block']);
      return block ? { op: 'create', block } : undefined;
    }
    case 'move': {
      const id = asString(value['id']);
      const x = asNumber(value['x']);
      const y = asNumber(value['y']);
      if (!id || x === undefined || y === undefined) return undefined;
      return { op: 'move', id, x, y };
    }
    case 'resize': {
      const id = asString(value['id']);
      const width = asNumber(value['width']);
      const height = asNumber(value['height']);
      if (!id || width === undefined || height === undefined) return undefined;
      return { op: 'resize', id, width, height };
    }
    case 'update': {
      const id = asString(value['id']);
      const patch = parsePatch(value['patch']);
      if (!id || !patch) return undefined;
      return { op: 'update', id, patch };
    }
    case 'connect': {
      const connector = parseConnector(value['connector']);
      return connector ? { op: 'connect', connector } : undefined;
    }
    case 'delete': {
      const id = asString(value['id']);
      return id ? { op: 'delete', id } : undefined;
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
 * **Unparseable text becomes a `message`, not an error** — a model answering
 * "what's on this canvas?" in prose has done the right thing. The cost is that
 * a genuinely broken response also surfaces as text, which is the safe
 * direction: the user reads the model's words and nothing touches the scene.
 *
 * Only used on the fallback path; a consumer supplying `resolveCommands`
 * produces a `CanvasResolution` directly and never comes through here.
 */
export function parseCanvasResolution(text: string): CanvasResolution {
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
    .map(parseCanvasCommand)
    .filter((command): command is CanvasCommand => command !== undefined);

  const message = asString(parsed['message']);
  const highlightBlockIds = asStringArray(parsed['highlightBlockIds']);
  const thinking = asString(parsed['thinking']);

  return {
    commands,
    ...(message ? { message } : {}),
    ...(highlightBlockIds ? { highlightBlockIds } : {}),
    ...(thinking ? { thinking } : {}),
  };
}
