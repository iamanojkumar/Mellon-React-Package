import { forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { CanvasBlock } from '../CanvasBlock/CanvasBlock';
import type { CanvasResizeHandle } from '../CanvasBlock/CanvasBlock';
import { CanvasConnector } from '../CanvasConnector/CanvasConnector';
import { CanvasOutline } from '../CanvasOutline/CanvasOutline';
import { CanvasPromptBar } from '../CanvasPromptBar/CanvasPromptBar';
import { CanvasChangePreview } from '../CanvasChangePreview/CanvasChangePreview';
import { CanvasChatPanel } from '../CanvasChatPanel/CanvasChatPanel';
import { CanvasToolbar } from '../CanvasToolbar/CanvasToolbar';
import type { CanvasInsertKind } from '../CanvasToolbar/CanvasToolbar';
import { ThinkingBlock } from '../ThinkingBlock/ThinkingBlock';
import { VisuallyHidden } from '../VisuallyHidden/VisuallyHidden';
import { useControllableState } from '../../hooks/useControllableState';
import { MAX_CANVAS_ZOOM, MIN_CANVAS_ZOOM, useCanvasViewport } from '../../hooks/useCanvasViewport';
import type { CanvasViewport } from '../../hooks/useCanvasViewport';
import { useCanvasCommands } from '../../hooks/useCanvasCommands';
import type {
  CanvasClusterResolver,
  CanvasCommandResolver,
  CanvasDiagramResolver,
} from '../../hooks/useCanvasCommands';
import { isClusterCandidate } from '../../utilities/canvasClusters';
import type { CanvasClusterOptions } from '../../utilities/canvasClusters';
import type { CanvasDiagramOptions } from '../../utilities/canvasDiagram';
import { Button } from '../Button/Button';
import type { CanvasSnapshotOptions } from '../../utilities/canvasSnapshot';
import { ToastContext } from '../../contexts/ToastContext';
import { mergeClasses } from '../../utilities/mergeClasses';
import { mergeRefs } from '../../utilities/mergeRefs';
import {
  applyCanvasCommands,
  canvasBlockLabel,
  EMPTY_CANVAS_SCENE,
  findCanvasBlock,
} from '../../utilities/canvasReducer';
import type { CanvasBlockData, CanvasCommand, CanvasScene } from '../../utilities/canvasReducer';
import {
  blockRect,
  boundsOf,
  outlineOrder,
  pointInRect,
  rectBounds,
  rectFromPoints,
  rectsIntersect,
  snapToGrid,
  snapToObjects,
  withFrameMembers,
} from '../../utilities/canvasGeometry';
import type { CanvasAlignmentGuide, CanvasPoint } from '../../utilities/canvasGeometry';
import styles from './Canvas.module.css';

export interface CanvasOwnProps {
  scene?: CanvasScene;
  defaultScene?: CanvasScene;
  onSceneChange?: (scene: CanvasScene) => void;
  /** Fires per applied command, whatever produced it — the audit seam. */
  onCommand?: (command: CanvasCommand) => void;

  selectedIds?: string[];
  defaultSelectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;

  /** Canvas units between snap lines. `0` disables snapping. Defaults to 8. */
  grid?: number;
  /** Shows the outline as a visible side panel as well as an accessible one. */
  outlineVisible?: boolean;
  /**
   * Adds a small floating toolbar for inserting shapes, sticky notes, nodes
   * and frames by hand — no `AIProvider` or resolver needed, unlike every
   * other Canvas affordance gated behind an opt-in. Off by default.
   */
  shapeToolbar?: boolean;
  /** Blocks all editing. The canvas still pans, zooms and reads. */
  readOnly?: boolean;
  renderBlock?: (block: CanvasBlockData) => ReactNode;
  /** Accessible name for the canvas region. */
  'aria-label'?: string;

  /**
   * Controlled pan/zoom state — pass this (with `onViewportChange`) so an
   * externally-rendered layer (e.g. a `pdf.js`-rasterized page) can read and
   * drive the same viewport the canvas uses, and stay pixel-locked to it.
   * Omit for the canvas to manage its own viewport, same
   * controlled/uncontrolled contract as `scene`/`selectedIds`.
   */
  viewport?: CanvasViewport;
  defaultViewport?: Partial<CanvasViewport>;
  onViewportChange?: (viewport: CanvasViewport) => void;

  /**
   * Renders beneath every block, inside the same world transform — so
   * consumer-supplied backdrop content (a rasterized page, an embedded
   * document) shares the canvas coordinate space and pans/zooms in lockstep
   * with blocks placed over it. Purely a positioning anchor: the returned
   * content decides its own size and position within canvas units, the same
   * way a block's `x`/`y` do. Off by default — nothing renders without it.
   */
  renderBackdrop?: () => ReactNode;

  /**
   * Adds the natural-language prompt bar — "add three notes for the risks",
   * "connect the login box to auth", "what's on this canvas?". Off by default,
   * and **renders nothing at all** unless there's a way to resolve a prompt:
   * an ancestor `AIProvider` or a `resolveCommands` of your own. With neither,
   * the canvas's output is byte-identical to the non-AI rendering.
   */
  aiPrompt?: boolean;
  /**
   * Decouples the prompt bar from the static row above the surface and
   * floats it as a draggable, minimizable panel over the canvas instead —
   * same `aiPrompt` gate, same `resolveCommands`/`submit` pipeline, just a
   * different position. Movable and minimizable, but never closable: it has
   * no unmounted state, only expanded/minimized. Always carries the current
   * selection's full block data as extra context on every prompt, and shows
   * the single most recent reply as one message bubble.
   */
  aiPromptFloating?: boolean;
  /**
   * Arbitrary extra context folded into every floating-chat prompt alongside
   * the current selection — anything the consuming app wants the model to
   * see that isn't canvas block data (the signed-in user, app-level state, a
   * page's own metadata, ...). Only meaningful with `aiPromptFloating`; the
   * static prompt bar has no equivalent slot. See `CanvasChatPanel`'s
   * `context` prop.
   */
  chatContext?: unknown;
  /**
   * Consumer-owned transport producing a `CanvasResolution`. Omit it and the
   * canvas falls back to `AIClient.complete` plus text parsing.
   *
   * Supplying this is itself an opt-in, so it enables the prompt bar with or
   * without an `AIProvider` mounted.
   */
  resolveCommands?: CanvasCommandResolver;
  /** Caps how much scene goes into a prompt. See `canvasSnapshot`. */
  snapshotOptions?: CanvasSnapshotOptions;
  promptPlaceholder?: string;
  /**
   * Adds a per-note "Rewrite with AI" trigger. Independent of `aiPrompt` —
   * this one goes through `AIClient.complete` directly, so it needs an
   * `AIProvider` and is inert without one, and a `resolveCommands` doesn't
   * enable it.
   */
  aiRewrite?: boolean;

  /**
   * Adds the affinity-mapping trigger: groups the notes by theme and frames
   * each group. Off by default, and — like `aiPrompt` — renders nothing at all
   * without an `AIProvider` or a `resolveClusters` of your own.
   *
   * Always staged for review, never auto-applied: clustering moves content the
   * user arranged themselves, which is exactly the blast radius the preview
   * exists for.
   */
  aiCluster?: boolean;
  /** Consumer-owned transport for clustering. Enables the trigger on its own. */
  resolveClusters?: CanvasClusterResolver;
  /** Grid spacing and group-count guidance for clustering. */
  clusterOptions?: CanvasClusterOptions;
  /** Label for the clustering trigger. Defaults to `'Group by theme'`. */
  clusterLabel?: string;

  /**
   * Adds the diagram bar: describe a flow or process, and it's drawn as shapes
   * and connectors, laid out by the library rather than by the model. Same
   * availability rule as `aiPrompt` — an `AIProvider` or a `resolveDiagram`.
   *
   * Applied straight away with an undo, unlike clustering: a generated diagram
   * adds content and touches nothing that was already here.
   */
  aiDiagram?: boolean;
  /** Consumer-owned transport for diagrams. Enables the bar on its own. */
  resolveDiagram?: CanvasDiagramResolver;
  /** Node size, spacing and direction for generated diagrams. */
  diagramOptions?: CanvasDiagramOptions;
  /** Placeholder for the diagram bar. */
  diagramPlaceholder?: string;
}

export type CanvasProps = Omit<ComponentPropsWithoutRef<'div'>, 'onChange' | 'children'> &
  CanvasOwnProps;

/** How far a pointer must travel before a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 3;
/** Canvas units a block moves per arrow press. Interaction geometry, not a design value. */
const NUDGE_STEP = 8;
const NUDGE_STEP_LARGE = 40;
/** Screen pixels the viewport pans per arrow press, and per Page key. */
const PAN_STEP = 64;
const PAN_STEP_LARGE = 240;
/** Multiplier per zoom step, shared by the wheel and the keyboard. */
const ZOOM_STEP = 1.2;

/** First `prefix-n` not already taken by any block or connector — same "collision-free counter" shape as `canvasDiagram.ts`'s own `nextId`. */
function nextSceneId(scene: CanvasScene, prefix: string): string {
  const taken = new Set<string>([
    ...scene.blocks.map((block) => block.id),
    ...scene.connectors.map((connector) => connector.id),
  ]);
  let index = 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

/** Default size for a block the toolbar inserts by hand — a pill-shaped node reads as a short, wide chip; everything else keeps its usual proportions. */
const TOOLBAR_INSERT_SIZE: Record<CanvasInsertKind, { width: number; height: number }> = {
  sticky: { width: 200, height: 160 },
  'shape-rectangle': { width: 160, height: 100 },
  'shape-ellipse': { width: 160, height: 100 },
  'shape-diamond': { width: 160, height: 120 },
  node: { width: 160, height: 44 },
  frame: { width: 360, height: 260 },
};

/**
 * Anything inside a block that owns its own press: a checklist's boxes and
 * their labels, a link card's anchor, a note's textarea, the AI trigger.
 * Matched by role rather than by an opt-in marker so a new block face is
 * interactive by default — the failure mode is silent (the control simply
 * stops responding) and a face author has no reason to expect a marker exists.
 *
 * `label` is in the list because a label *is* its control: dragging a block by
 * a checklist row would otherwise tick the box on release, which is a state
 * change nobody asked for. Such a block is dragged by its title or its padding
 * instead — the usual bargain wherever a draggable surface holds real controls.
 */
const INTERACTIVE_IN_BLOCK =
  'a[href], button, input, select, textarea, label, [contenteditable="true"], [data-canvas-block-actions]';

type Gesture =
  | { kind: 'none' }
  | { kind: 'pan'; startX: number; startY: number; panX: number; panY: number }
  | { kind: 'marquee'; origin: CanvasPoint; current: CanvasPoint }
  | {
      kind: 'move';
      origin: CanvasPoint;
      /** Where each dragged block started, so the whole selection moves together. */
      starts: Map<string, { x: number; y: number }>;
    }
  | {
      kind: 'resize';
      id: string;
      handle: CanvasResizeHandle;
      origin: CanvasPoint;
      start: { x: number; y: number; width: number; height: number };
    };

function resizeFrom(
  start: { x: number; y: number; width: number; height: number },
  handle: CanvasResizeHandle,
  dx: number,
  dy: number,
): { x: number; y: number; width: number; height: number } {
  const north = handle.includes('n');
  const south = handle.includes('s');
  const west = handle.includes('w');
  const east = handle.includes('e');

  // Dragging a north or west handle moves the origin as well as the size —
  // the opposite edge is what stays put.
  return {
    x: start.x + (west ? dx : 0),
    y: start.y + (north ? dy : 0),
    width: start.width + (east ? dx : 0) - (west ? dx : 0),
    height: start.height + (south ? dy : 0) - (north ? dy : 0),
  };
}

/**
 * An infinite, pannable, zoomable workspace of positioned blocks.
 *
 * Built from DOM rather than a `<canvas>` deliberately: blocks stay real
 * elements, so every existing component can be one, `--ds-*` tokens and all
 * three themes apply for free, and each block remains focusable and present in
 * the accessibility tree. A raster canvas would buy scale at the cost of all
 * four.
 *
 * The whole scene sits under one `transform`, so blocks store plain canvas
 * coordinates and never know the viewport exists; pointer positions convert
 * once, at the boundary.
 *
 * Every mutation — drag, resize, keyboard nudge, prompt, and clustering —
 * becomes a `CanvasCommand` through `applyCanvasCommands`, so no two input
 * paths can disagree about clamping or cascade rules.
 *
 * **Blocks stay in the accessibility tree as labelled groups**; only the
 * connector geometry is `aria-hidden`, and `CanvasOutline` is a navigation aid
 * over the blocks rather than a substitute for them.
 */
const CanvasRoot = forwardRef<HTMLDivElement, CanvasProps>(function Canvas(
  {
    scene: controlledScene,
    defaultScene,
    onSceneChange,
    onCommand,
    selectedIds: controlledSelection,
    defaultSelectedIds,
    onSelectionChange,
    grid = 8,
    outlineVisible = false,
    shapeToolbar = false,
    readOnly = false,
    renderBlock,
    viewport: controlledViewport,
    defaultViewport,
    onViewportChange,
    renderBackdrop,
    aiPrompt = false,
    aiPromptFloating = false,
    chatContext,
    resolveCommands,
    snapshotOptions,
    promptPlaceholder,
    aiRewrite = false,
    aiCluster = false,
    resolveClusters,
    clusterOptions,
    clusterLabel = 'Group by theme',
    aiDiagram = false,
    resolveDiagram,
    diagramOptions,
    diagramPlaceholder = 'Describe a flow, process, or structure…',
    className,
    'aria-label': ariaLabel = 'Canvas',
    ...rest
  },
  ref,
) {
  const [scene, setScene] = useControllableState<CanvasScene>({
    value: controlledScene,
    defaultValue: defaultScene ?? EMPTY_CANVAS_SCENE,
    onChange: onSceneChange,
  });

  const [selectedIds, setSelectedIds] = useControllableState<string[]>({
    value: controlledSelection,
    defaultValue: defaultSelectedIds ?? [],
    onChange: onSelectionChange,
  });

  const viewport = useCanvasViewport({
    ...(controlledViewport ? { viewport: controlledViewport } : {}),
    ...(defaultViewport ? { defaultViewport } : {}),
    ...(onViewportChange ? { onViewportChange } : {}),
  });
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [gesture, setGesture] = useState<Gesture>({ kind: 'none' });
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [announcement, setAnnouncement] = useState('');
  /** Ephemeral — only ever non-empty mid-drag, cleared the moment the gesture ends. */
  const [alignmentGuides, setAlignmentGuides] = useState<CanvasAlignmentGuide[]>([]);
  /** The one block focus mode isolates. `undefined` means focus mode is off. */
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  /** Only meaningful while `focusedId` is set — freezes pan/zoom/scroll. */
  const [focusLocked, setFocusLocked] = useState(false);
  /** The `node` block whose output port is armed, waiting for a target's input port. `undefined` when no connection is in progress. */
  const [pendingNodeSource, setPendingNodeSource] = useState<string | undefined>(undefined);

  const run = useCallback(
    (commands: CanvasCommand[]) => {
      const result = applyCanvasCommands(scene, commands);
      if (result.applied.length === 0) return scene;
      setScene(result.scene);
      result.applied.forEach((command) => onCommand?.(command));
      return result.scene;
    },
    [scene, setScene, onCommand],
  );

  // ------------------------------------------------------------- node ports

  /** Arms (or, clicked again, disarms) a `node` block's output as a connection's source. */
  const handleNodeOutputPortClick = useCallback(
    (id: string) => {
      setPendingNodeSource((current) => {
        const next = current === id ? undefined : id;
        const source = next ? findCanvasBlock(scene, next) : undefined;
        setAnnouncement(
          next && source
            ? `Connecting from ${canvasBlockLabel(source)}. Select another node's input to connect, or press Escape to cancel.`
            : '',
        );
        return next;
      });
    },
    [scene],
  );

  /** Completes a pending connection at this `node` block's input, through the same reducer every other mutation goes through. */
  const handleNodeInputPortClick = useCallback(
    (id: string) => {
      if (!pendingNodeSource || pendingNodeSource === id) {
        setPendingNodeSource(undefined);
        return;
      }
      run([
        {
          op: 'connect',
          connector: {
            id: nextSceneId(scene, 'connector'),
            from: pendingNodeSource,
            to: id,
            arrow: 'end',
          },
        },
      ]);
      setPendingNodeSource(undefined);
      setAnnouncement('');
    },
    [pendingNodeSource, scene, run],
  );

  /** Inserts a new block of the toolbar's choosing at the current viewport centre, offset a little further each time so repeated clicks don't stack blocks exactly on top of one another. */
  const insertCascadeRef = useRef(0);
  const handleToolbarInsert = useCallback(
    (kind: CanvasInsertKind) => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      const centre = viewport.toCanvas({
        x: (rect?.width ?? 0) / 2,
        y: (rect?.height ?? 0) / 2,
      });
      const cascade = (insertCascadeRef.current % 6) * 24;
      insertCascadeRef.current += 1;

      const { width, height } = TOOLBAR_INSERT_SIZE[kind];
      const x = centre.x - width / 2 + cascade;
      const y = centre.y - height / 2 + cascade;
      const id = nextSceneId(
        scene,
        kind === 'node' ? 'node' : kind.startsWith('shape') ? 'shape' : kind,
      );

      const block: CanvasBlockData =
        kind === 'sticky'
          ? { id, kind: 'sticky', x, y, width, height, text: '' }
          : kind === 'node'
            ? { id, kind: 'node', x, y, width, height, name: 'Node' }
            : kind === 'frame'
              ? { id, kind: 'frame', x, y, width, height, title: 'Frame' }
              : {
                  id,
                  kind: 'shape',
                  x,
                  y,
                  width,
                  height,
                  shape:
                    kind === 'shape-ellipse'
                      ? 'ellipse'
                      : kind === 'shape-diamond'
                        ? 'diamond'
                        : 'rectangle',
                };

      run([{ op: 'create', block }]);
      setSelectedIds([id]);
    },
    [scene, viewport, run, setSelectedIds],
  );

  /** Pointer position in canvas units, relative to the canvas box. */
  const pointerToCanvas = useCallback(
    (event: { clientX: number; clientY: number }): CanvasPoint => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      return viewport.toCanvas({
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      });
    },
    [viewport],
  );

  // ---------------------------------------------------------------- pointer

  /** Alt or the middle button means "pan", wherever the pointer happens to be. */
  const isPanGesture = (event: { button: number; altKey: boolean }) =>
    event.button === 1 || event.altKey;

  const onSurfacePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const point = pointerToCanvas(event);

    if (isPanGesture(event)) {
      // Locked focus freezes panning along with everything else; unlocked
      // focus still allows it — looking around is not the interaction focus
      // mode restricts.
      if (focusedId && focusLocked) return;
      setGesture({
        kind: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        panX: viewport.viewport.panX,
        panY: viewport.viewport.panY,
      });
    } else {
      // Focused: the surface itself is off-limits — no marquee, no
      // click-to-deselect. Only the focused block responds to anything.
      if (focusedId) return;
      setGesture({ kind: 'marquee', origin: point, current: point });
      if (!event.shiftKey) setSelectedIds([]);
    }

    setEditingId(undefined);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onBlockPointerDown = (event: PointerEvent<HTMLDivElement>, block: CanvasBlockData) => {
    if (editingId === block.id) return;
    // A pan gesture belongs to the surface even when it starts over a block —
    // otherwise panning is impossible anywhere the canvas is actually full,
    // which is exactly when you need it. Left un-stopped so it bubbles.
    if (isPanGesture(event)) return;

    // Focused: every other block is off-limits, stopped here so it doesn't
    // fall through to the surface and start a marquee instead.
    if (focusedId && block.id !== focusedId) {
      event.stopPropagation();
      return;
    }

    // A press on a control inside a block is a click on that control, not the
    // start of a drag. Starting one would call `setPointerCapture` on the
    // block, and a captured pointer never delivers its click to the control —
    // which is how a checklist's boxes silently stopped ticking. Stopped here
    // so the surface doesn't start a marquee (and capture it) instead.
    if ((event.target as HTMLElement | null)?.closest(INTERACTIVE_IN_BLOCK)) {
      event.stopPropagation();
      return;
    }

    event.stopPropagation();

    const next = event.shiftKey
      ? selectedIds.includes(block.id)
        ? selectedIds.filter((id) => id !== block.id)
        : [...selectedIds, block.id]
      : selectedIds.includes(block.id)
        ? selectedIds
        : [block.id];
    setSelectedIds(next);

    if (readOnly) return;

    // Every selected block moves together, so each one's starting position has
    // to be captured up front — deriving it from a running delta would compound
    // rounding on every frame. A selected frame also carries whatever sits
    // visually inside it, without adding those blocks to the selection itself
    // — dragging a frame shouldn't make Delete remove its contents too.
    const starts = new Map<string, { x: number; y: number }>();
    for (const id of withFrameMembers(next, scene.blocks)) {
      const member = findCanvasBlock(scene, id);
      if (member) starts.set(id, { x: member.x, y: member.y });
    }

    // No `setPointerCapture` here: a captured pointer never delivers its click
    // to whatever it pressed, which is how a control inside a block stops
    // responding. Capture is taken in `onPointerMove`, once the pointer has
    // travelled far enough that this is unambiguously a drag.
    setGesture({ kind: 'move', origin: pointerToCanvas(event), starts });
  };

  const onResizeStart = (
    event: PointerEvent,
    block: CanvasBlockData,
    handle: CanvasResizeHandle,
  ) => {
    if (readOnly) return;
    event.stopPropagation();
    setSelectedIds([block.id]);
    setGesture({
      kind: 'resize',
      id: block.id,
      handle,
      origin: pointerToCanvas(event),
      start: { x: block.x, y: block.y, width: block.width, height: block.height },
    });
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.kind === 'none') return;

    if (gesture.kind === 'pan') {
      viewport.setViewport({
        zoom: viewport.viewport.zoom,
        panX: gesture.panX + (event.clientX - gesture.startX),
        panY: gesture.panY + (event.clientY - gesture.startY),
      });
      return;
    }

    const point = pointerToCanvas(event);

    if (gesture.kind === 'marquee') {
      setGesture({ ...gesture, current: point });
      return;
    }

    if (gesture.kind === 'move') {
      const dx = point.x - gesture.origin.x;
      const dy = point.y - gesture.origin.y;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      // Now it's a drag: take the pointer so it can leave the surface without
      // stranding the block mid-move. Idempotent, and feature-detected for
      // jsdom like every other pointer-capture call in this library.
      event.currentTarget.setPointerCapture?.(event.pointerId);

      const draggedIds = new Set(gesture.starts.keys());
      const proposed = [...gesture.starts.entries()].map(([id, start]) => {
        const block = findCanvasBlock(scene, id);
        return {
          id,
          x: start.x + dx,
          y: start.y + dy,
          width: block?.width ?? 0,
          height: block?.height ?? 0,
        };
      });
      const groupRect = rectBounds(proposed);

      // Object-snap is computed against the group's own bounding box, not
      // each block individually — dragging a multi-selection (or a frame and
      // its members) snaps the whole thing as one unit, the same as every
      // other multi-block move already treats the selection as one.
      const candidates = scene.blocks.filter((block) => !draggedIds.has(block.id)).map(blockRect);
      const snap = groupRect ? snapToObjects(groupRect, candidates) : undefined;
      setAlignmentGuides(snap?.guides ?? []);

      const groupDx = snap ? snap.x - (groupRect?.x ?? 0) : 0;
      const groupDy = snap ? snap.y - (groupRect?.y ?? 0) : 0;

      run(
        proposed.map((block) => ({
          op: 'move' as const,
          id: block.id,
          x: snap?.snappedX ? block.x + groupDx : snapToGrid(block.x, grid),
          y: snap?.snappedY ? block.y + groupDy : snapToGrid(block.y, grid),
        })),
      );
      return;
    }

    if (gesture.kind === 'resize') {
      const next = resizeFrom(
        gesture.start,
        gesture.handle,
        point.x - gesture.origin.x,
        point.y - gesture.origin.y,
      );
      run([
        { op: 'move', id: gesture.id, x: snapToGrid(next.x, grid), y: snapToGrid(next.y, grid) },
        {
          op: 'resize',
          id: gesture.id,
          width: snapToGrid(next.width, grid),
          height: snapToGrid(next.height, grid),
        },
      ]);
    }
  };

  const onPointerUp = () => {
    if (gesture.kind === 'marquee') {
      const marquee = rectFromPoints(gesture.origin, gesture.current);
      // A click, not a drag — leave the selection alone rather than clearing it
      // twice or selecting everything under a zero-area rect.
      if (marquee.width >= DRAG_THRESHOLD || marquee.height >= DRAG_THRESHOLD) {
        setSelectedIds(
          scene.blocks
            .filter((block) => rectsIntersect(marquee, blockRect(block)))
            .map((block) => block.id),
        );
      }
    }
    setGesture({ kind: 'none' });
    if (alignmentGuides.length > 0) setAlignmentGuides([]);
  };

  /**
   * Wheel and trackpad: Ctrl/Cmd zooms about the pointer, Shift scrolls
   * sideways, and a plain wheel or two-finger swipe pans freely.
   *
   * Bound natively rather than through `onWheel` because React registers wheel
   * listeners as **passive**, where `preventDefault` does nothing — so the page
   * behind the canvas would scroll away underneath the gesture, and Ctrl+wheel
   * would zoom the whole browser instead of the scene.
   */
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (focusedId && focusLocked) return;
      const rect = surface.getBoundingClientRect();

      if (event.ctrlKey || event.metaKey) {
        viewport.zoomBy(event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP, {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
        return;
      }

      // A mouse wheel only reports deltaY, so Shift is how it reaches the
      // horizontal axis; a trackpad already sends both and needs no modifier.
      if (event.shiftKey && event.deltaX === 0) {
        viewport.panBy(-event.deltaY, 0);
        return;
      }

      viewport.panBy(-event.deltaX, -event.deltaY);
    };

    surface.addEventListener('wheel', onWheel, { passive: false });
    return () => surface.removeEventListener('wheel', onWheel);
  }, [viewport, focusedId, focusLocked]);

  // --------------------------------------------------------------- keyboard

  /** Announces zoom as a percentage — the visual change is invisible non-visually. */
  const announceZoom = (zoom: number) => {
    setAnnouncement(`Zoom ${Math.round(zoom * 100)} percent.`);
  };

  const zoomFromKeyboard = (factor: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    // About the centre of the view, since a keyboard has no pointer position.
    const origin = rect ? { x: rect.width / 2, y: rect.height / 2 } : undefined;
    viewport.zoomBy(factor, origin);
    announceZoom(
      Math.min(MAX_CANVAS_ZOOM, Math.max(MIN_CANVAS_ZOOM, viewport.viewport.zoom * factor)),
    );
  };

  /**
   * Zooms/centres the viewport on one block and narrows the selection to it
   * — entering focus mode always isolates exactly one block, however many
   * were selected going in. `locked` defaults to `false` (the `F` key's own
   * behaviour); a `document` block entering its editor passes `true`, since
   * editing it is the one case this library defaults focus to locked rather
   * than leaving the viewport free.
   */
  const enterFocus = (id: string, locked = false) => {
    const block = findCanvasBlock(scene, id);
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (block && rect) {
      viewport.fitTo(blockRect(block), { width: rect.width, height: rect.height }, 96);
    }
    setSelectedIds([id]);
    setFocusedId(id);
    setFocusLocked(locked);
    setAnnouncement(
      `Focused on ${block ? canvasBlockLabel(block) : id}. Press L to lock, Escape to exit.`,
    );
  };

  const exitFocus = () => {
    setFocusedId(undefined);
    setFocusLocked(false);
    // A document block entering focus locked came from opening its editor —
    // leaving focus is the same gesture as closing it again, so the two
    // states never drift apart into "unfocused but still mid-edit".
    setEditingId((current) => {
      const block = current ? findCanvasBlock(scene, current) : undefined;
      return block?.kind === 'document' ? undefined : current;
    });
    setAnnouncement('Focus exited.');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys aimed at a control inside a block (a note's textarea) belong to
    // it — except Escape while focused, which still needs to reach the
    // focus-exit branch below. A sticky's own textarea already stops
    // Escape from bubbling this far (it handles it locally), and plain
    // editing with no focus mode active never reaches here either way, so
    // this only ever matters for a `document` block's editor, which enters
    // focus on double-click and has no local Escape handling of its own.
    if (editingId && !(event.key === 'Escape' && focusedId)) return;

    const primary = selectedIds[0];

    if (event.key === 'Escape') {
      // Narrowest state first: a pending connection, then focus mode, then
      // the selection — never more than one of these unwinds per keystroke.
      if (pendingNodeSource) {
        setPendingNodeSource(undefined);
        setAnnouncement('Connection cancelled.');
        return;
      }
      if (focusedId) {
        exitFocus();
        return;
      }
      setSelectedIds([]);
      return;
    }

    // ---- focus mode --------------------------------------------------------
    //
    // F isolates the primary selection: zooms/centres it and dims everything
    // else. L only means something while focused, so it's read alongside F
    // rather than among the viewport keys below, which L partly gates.

    if (event.key === 'f' || event.key === 'F') {
      event.preventDefault();
      if (focusedId && focusedId === primary) {
        exitFocus();
      } else if (primary) {
        enterFocus(primary);
      }
      return;
    }

    if ((event.key === 'l' || event.key === 'L') && focusedId) {
      event.preventDefault();
      setFocusLocked((value) => !value);
      setAnnouncement(focusLocked ? 'Focus unlocked.' : 'Focus locked.');
      return;
    }

    // ---- viewport keys, ahead of everything else -------------------------
    //
    // Zoom and pan stay available with no selection and in `readOnly`: looking
    // around is not editing. Without these the canvas was pointer-only for
    // navigation, which made every off-screen block unreachable by keyboard.
    // Locked focus is the one thing that overrides this: every branch here
    // pans or zooms the viewport, which is exactly what locked means frozen —
    // nudging the focused block itself, below, is a separate, ungated path.
    const viewportLocked = Boolean(focusedId && focusLocked);

    if (!viewportLocked && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      zoomFromKeyboard(ZOOM_STEP);
      return;
    }

    if (!viewportLocked && (event.key === '-' || event.key === '_')) {
      event.preventDefault();
      zoomFromKeyboard(1 / ZOOM_STEP);
      return;
    }

    if (!viewportLocked && event.key === '0') {
      event.preventDefault();
      viewport.reset();
      announceZoom(1);
      return;
    }

    if (!viewportLocked && event.key === '1') {
      event.preventDefault();
      const bounds = boundsOf(scene.blocks);
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (bounds && rect) {
        viewport.fitTo(bounds, { width: rect.width, height: rect.height });
        setAnnouncement('Zoomed to fit.');
      }
      return;
    }

    const panStep = event.shiftKey ? PAN_STEP_LARGE : PAN_STEP;

    if (!viewportLocked && (event.key === 'PageUp' || event.key === 'PageDown')) {
      event.preventDefault();
      viewport.panBy(0, event.key === 'PageUp' ? PAN_STEP_LARGE : -PAN_STEP_LARGE);
      return;
    }

    const panDeltas: Record<string, [number, number]> = {
      ArrowLeft: [1, 0],
      ArrowRight: [-1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };

    // With nothing selected the arrows have no block to move, so they scroll
    // the view — the keyboard equivalent of a two-finger swipe. Ctrl/Cmd forces
    // the same thing even when a block *is* selected.
    const panDelta = panDeltas[event.key];
    if (!viewportLocked && panDelta && (!primary || event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      viewport.panBy(panDelta[0] * panStep, panDelta[1] * panStep);
      return;
    }

    if (!primary || readOnly) return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      const names = selectedIds
        .map((id) => {
          const block = findCanvasBlock(scene, id);
          return block ? canvasBlockLabel(block) : undefined;
        })
        .filter(Boolean);
      run(selectedIds.map((id) => ({ op: 'delete' as const, id })));
      setSelectedIds([]);
      setAnnouncement(`Deleted ${names.join(', ')}.`);
      return;
    }

    if (event.key === 'Enter') {
      const block = findCanvasBlock(scene, primary);
      if (block?.kind === 'sticky' || block?.kind === 'shape') {
        event.preventDefault();
        setEditingId(primary);
      }
      return;
    }

    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = deltas[event.key];
    if (!delta) return;
    event.preventDefault();

    const [dx, dy] = delta;
    const step = event.shiftKey ? NUDGE_STEP_LARGE : Math.max(grid, NUDGE_STEP);

    // Alt turns the arrows into a resize, so the keyboard reaches the same
    // outcomes as the pointer handles without needing eight more tab stops.
    if (event.altKey) {
      const block = findCanvasBlock(scene, primary);
      if (!block) return;
      const next = run([
        {
          op: 'resize',
          id: primary,
          width: block.width + dx * step,
          height: block.height + dy * step,
        },
      ]);
      const resized = findCanvasBlock(next, primary);
      if (resized) {
        setAnnouncement(
          `${canvasBlockLabel(resized)} resized to ${Math.round(resized.width)} by ${Math.round(resized.height)}.`,
        );
      }
      return;
    }

    // Same cohesion as a pointer drag: a selected frame's geometric contents
    // nudge along with it, without joining the selection itself.
    const moved = run(
      withFrameMembers(selectedIds, scene.blocks).flatMap((id) => {
        const block = findCanvasBlock(scene, id);
        if (!block) return [];
        return [{ op: 'move' as const, id, x: block.x + dx * step, y: block.y + dy * step }];
      }),
    );
    const primaryBlock = findCanvasBlock(moved, primary);
    if (primaryBlock) {
      setAnnouncement(
        `${canvasBlockLabel(primaryBlock)} at ${Math.round(primaryBlock.x)}, ${Math.round(primaryBlock.y)}.`,
      );
    }
  };

  // --------------------------------------------------------------------- AI

  // `useToast` throws outside its provider, so the optional undo reads context
  // directly — an undo affordance must never be why a canvas can't mount.
  const toastContext = useContext(ToastContext);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  const commands = useCanvasCommands({
    scene,
    ...(resolveCommands ? { resolveCommands } : {}),
    ...(resolveClusters ? { resolveClusters } : {}),
    ...(resolveDiagram ? { resolveDiagram } : {}),
    ...(snapshotOptions ? { snapshotOptions } : {}),
    ...(clusterOptions ? { clusterOptions } : {}),
    ...(diagramOptions ? { diagramOptions } : {}),
    onApply: (nextScene, appliedCommands) => {
      setScene(nextScene);
      appliedCommands.forEach((command) => onCommand?.(command));
    },
  });

  const { outcome } = commands;
  const showPrompt = aiPrompt && commands.available;
  const showStaticPrompt = showPrompt && !aiPromptFloating;
  const showFloatingPrompt = showPrompt && aiPromptFloating;
  const showCluster = aiCluster && commands.clusterAvailable && !readOnly;
  const showDiagram = aiDiagram && commands.diagramAvailable && !readOnly;
  // Gates the staged-review panel too, so a change the floating chat proposes
  // still gets the same review UI a change from the static bar would.
  const showAIPanels = showPrompt || showCluster || showDiagram;

  // A selected frame hands the chat its own data plus every block visually
  // inside it — "what's wrong with this group" needs the group's members,
  // not just the frame's title.
  const contextBlockIds = withFrameMembers(selectedIds, scene.blocks);
  const selectedBlocks = scene.blocks.filter((block) => contextBlockIds.includes(block.id));

  // The floating panel keeps its own "one visible last chat" line, since it
  // has no top-of-canvas `.answer` paragraph to share — the same outcome the
  // static bar renders inline, reduced to one line each.
  const floatingLastMessage = (() => {
    if (outcome.kind === 'answer') return outcome.message;
    if (outcome.kind === 'applied') {
      const summary =
        outcome.commands.length === 1
          ? '1 change applied.'
          : `${outcome.commands.length} changes applied.`;
      return outcome.message ? `${summary} ${outcome.message}` : summary;
    }
    if (outcome.kind === 'staged') return outcome.message ?? 'Reviewing suggested changes…';
    if (outcome.kind === 'error') return outcome.error;
    return undefined;
  })();
  const floatingLastMessageVariant = outcome.kind === 'error' ? 'error' : 'ai';

  // A selection of two or more scopes the grouping to it; otherwise every
  // text-bearing block is in play. Frames are never members — membership is
  // geometric, so a framed frame would leave a note inside two regions at once.
  const clusterTargets = (
    selectedIds.length >= 2
      ? scene.blocks.filter((block) => selectedIds.includes(block.id))
      : scene.blocks
  ).filter(isClusterCandidate);

  useEffect(() => {
    if (outcome.kind === 'answer') {
      setHighlightedIds(outcome.highlightBlockIds);
      setAnnouncement(outcome.message);
      return;
    }

    setHighlightedIds([]);

    if (outcome.kind === 'applied') {
      const summary =
        outcome.commands.length === 1
          ? '1 change applied.'
          : `${outcome.commands.length} changes applied.`;
      // The message carries anything the request lost on the way — a dropped
      // edge, a node over the limit. On this path there is no review panel to
      // read it in, so it has to be announced with the summary.
      setAnnouncement(outcome.message ? `${summary} ${outcome.message}` : summary);
      toastContext?.toast({
        description: summary,
        variant: 'success',
        action: { label: 'Undo', onClick: commands.undo },
      });
    }

    if (outcome.kind === 'error') setAnnouncement(`Request failed: ${outcome.error}`);
  }, [outcome, toastContext, commands.undo]);

  // ----------------------------------------------------------------- render

  const marquee =
    gesture.kind === 'marquee' ? rectFromPoints(gesture.origin, gesture.current) : undefined;

  // Three paint bands: frames (backdrops), then the connector layer, then
  // everything else. Connectors sit above frames deliberately — a frame is a
  // region an edge runs *through*, so painting the whole SVG under it hid every
  // connector inside a framed group.
  const frames = scene.blocks.filter((block) => block.kind === 'frame');
  const content = scene.blocks.filter((block) => block.kind !== 'frame');

  return (
    <div className={mergeClasses(styles.canvas, className)}>
      {showStaticPrompt && (
        <CanvasPromptBar
          blocks={scene.blocks}
          onSubmit={commands.submit}
          status={commands.status}
          {...(outcome.kind === 'error' ? { error: outcome.error } : {})}
          disabled={readOnly}
          {...(promptPlaceholder ? { placeholder: promptPlaceholder } : {})}
        />
      )}

      {(showCluster || showDiagram) && (
        <div className={styles.toolbar}>
          {showDiagram && (
            <CanvasPromptBar
              className={styles.diagramBar}
              /* No `@` picker: a diagram's node ids are local to the response
                 and join its own edges, so there is no existing block for a
                 mention to resolve to. */
              blocks={[]}
              onSubmit={commands.diagram}
              status={commands.status}
              placeholder={diagramPlaceholder}
              label="Describe a diagram"
              submitLabel="Draw"
              disabled={readOnly}
            />
          )}

          {showCluster && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                commands.cluster({ blockIds: clusterTargets.map((block) => block.id) })
              }
              loading={commands.status === 'loading'}
              disabled={clusterTargets.length < 2}
            >
              {selectedIds.length >= 2 ? `${clusterLabel} (selection)` : clusterLabel}
            </Button>
          )}
        </div>
      )}

      {/* The prompt bar shows its own errors. Without it mounted, a failed
          cluster or diagram would otherwise only ever be announced. */}
      {showAIPanels && !showPrompt && outcome.kind === 'error' && (
        <p className={styles.error} role="alert">
          {outcome.error}
        </p>
      )}

      {/* The model's own account of why it answered or acted this way, shown
          collapsed by default. Skipped when the floating panel is mounted —
          it renders the same `commands.thinking` above its own reply. */}
      {showAIPanels && !showFloatingPrompt && commands.thinking && (
        <ThinkingBlock>{commands.thinking}</ThinkingBlock>
      )}

      {/* A question's answer is shown, not just announced — reading it is the
          entire point of the query path. An applied change carries a message
          too when something was dropped on the way, and that path has no review
          panel to report it in. Skipped when the floating panel is mounted —
          it already shows the same reply as its own "last chat" bubble. */}
      {showAIPanels &&
        !showFloatingPrompt &&
        (outcome.kind === 'answer' || outcome.kind === 'applied') &&
        outcome.message && <p className={styles.answer}>{outcome.message}</p>}

      {showAIPanels && outcome.kind === 'staged' && (
        <CanvasChangePreview
          scene={scene}
          commands={outcome.commands}
          rejected={outcome.rejected}
          {...(outcome.message ? { message: outcome.message } : {})}
          onAccept={commands.acceptStaged}
          onReject={commands.reset}
        />
      )}

      {/*
        A composite widget: the surface takes focus and owns the keys, while the
        blocks inside stay readable groups and the outline below supplies
        reading order. `role="application"` would be wrong here — it hands every
        keystroke to content that has no per-element keyboard model of its own.
        `role="group"` plus the outline is the honest shape, and
        it's the same composite pattern `KanbanBoard` uses; neither rule below
        can model a widget whose focus lives on the container.
      */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        ref={mergeRefs(ref, surfaceRef)}
        role="group"
        aria-label={ariaLabel}
        /* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */
        tabIndex={0}
        className={styles.surface}
        onPointerDown={onSurfacePointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={handleKeyDown}
        data-panning={gesture.kind === 'pan' ? '' : undefined}
        {...rest}
      >
        {/*
          The world is deliberately **not** `aria-hidden`. The chart analogy
          only goes so far: a chart's SVG is paths with no text, so hiding it
          loses nothing, but canvas blocks contain real content — and real
          controls (a note's textarea, an AI trigger). Hiding them would leave
          focusable elements inside an `aria-hidden` subtree, which is an
          outright violation, not a trade-off.

          So blocks are labelled groups in the tree, `CanvasOutline` is a
          navigation aid over them rather than a substitute for them, and only
          the connector SVG — pure geometry, whose meaning the outline states
          as text — stays hidden.
        */}
        <div className={styles.world} style={{ transform: viewport.transform }}>
          {/* aria-hidden: a raster backdrop (e.g. a rasterized page) carries no
              text of its own — the same reasoning that keeps the connector SVG
              hidden. Any actually-readable content over it is its own
              `CanvasBlock`, which stays in the tree as usual. */}
          {renderBackdrop && (
            <div className={styles.backdrop} aria-hidden="true">
              {renderBackdrop()}
            </div>
          )}

          {frames.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              selected={selectedIds.includes(block.id)}
              highlighted={highlightedIds.includes(block.id)}
              resizable={!readOnly}
              {...(block.id === focusedId ? { style: { zIndex: 2 } } : {})}
              {...(renderBlock ? { renderBlock } : {})}
              onPointerDown={(event) => onBlockPointerDown(event, block)}
              onResizeStart={(event, handle) => onResizeStart(event, block, handle)}
            />
          ))}

          <svg className={styles.connectors} aria-hidden="true">
            {scene.connectors.map((connector) => (
              <CanvasConnector
                key={connector.id}
                scene={scene}
                connector={connector}
                selected={selectedIds.includes(connector.id)}
                onSelect={(id) => setSelectedIds([id])}
              />
            ))}
          </svg>

          {/* Everything but the focused block sits beneath this — pure
              layering (the overlay's z-index, the focused block's own bump
              below), no per-block opacity and so no new opacity token
              needed. `pointer-events: none` since interaction is already
              restricted in the pointer handlers themselves. */}
          {focusedId && <div className={styles.focusOverlay} aria-hidden="true" />}

          {content.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              selected={selectedIds.includes(block.id)}
              highlighted={highlightedIds.includes(block.id)}
              editing={editingId === block.id}
              resizable={!readOnly}
              aiRewrite={aiRewrite && !readOnly}
              {...(block.id === focusedId ? { style: { zIndex: 2 } } : {})}
              {...(renderBlock ? { renderBlock } : {})}
              onPointerDown={(event) => onBlockPointerDown(event, block)}
              onResizeStart={(event, handle) => onResizeStart(event, block, handle)}
              onDoubleClick={() => {
                if (readOnly) return;
                if (block.kind === 'sticky' || block.kind === 'shape') setEditingId(block.id);
                if (block.kind === 'document') {
                  setEditingId(block.id);
                  // Opening a document's editor defaults to locked focus —
                  // the one case in this library where entering focus isn't
                  // the free-to-look-around default, since editing text
                  // while the viewport can still be panned/zoomed out from
                  // under you is the actual bad experience being avoided.
                  enterFocus(block.id, true);
                }
              }}
              onTextChange={(text) => run([{ op: 'update', id: block.id, patch: { text } }])}
              onEditingEnd={() => setEditingId(undefined)}
              {...(block.kind === 'document' && !readOnly
                ? {
                    onPagesChange: (pages: string[]) =>
                      run([{ op: 'update', id: block.id, patch: { pages } }]),
                    onHeaderChange: (header: string) =>
                      run([{ op: 'update', id: block.id, patch: { header } }]),
                    onFooterChange: (footer: string) =>
                      run([{ op: 'update', id: block.id, patch: { footer } }]),
                  }
                : {})}
              {...((block.kind === 'sticky' || block.kind === 'shape' || block.kind === 'node') &&
              !readOnly
                ? {
                    onColorChange: (color: string) =>
                      run([{ op: 'update', id: block.id, patch: { color } }]),
                  }
                : {})}
              {...(block.kind === 'node' && !readOnly
                ? {
                    onNameChange: (name: string) =>
                      run([{ op: 'update', id: block.id, patch: { name } }]),
                    onOutputPortClick: handleNodeOutputPortClick,
                    onInputPortClick: handleNodeInputPortClick,
                    nodeConnecting: pendingNodeSource === block.id,
                  }
                : {})}
              {...(block.kind === 'checklist' && !readOnly
                ? {
                    // Through the reducer like everything else, so a box ticked
                    // by hand and one ticked by a model are the same command.
                    onItemToggle: (itemId: string, done: boolean) =>
                      run([
                        {
                          op: 'update',
                          id: block.id,
                          patch: {
                            items: block.items.map((item) =>
                              item.id === itemId ? { ...item, done } : item,
                            ),
                          },
                        },
                      ]),
                  }
                : {})}
            />
          ))}

          {marquee && (
            <div
              className={styles.marquee}
              style={{
                transform: `translate(${marquee.x}px, ${marquee.y}px)`,
                width: marquee.width,
                height: marquee.height,
              }}
            />
          )}

          {/* Ephemeral, mid-drag only — pure geometry like the connector SVG,
              so hidden the same way. */}
          {alignmentGuides.length > 0 && (
            <svg className={styles.guides} aria-hidden="true">
              {alignmentGuides.map((guide, index) =>
                guide.orientation === 'vertical' ? (
                  <line
                    key={index}
                    className={styles.guideLine}
                    x1={guide.position}
                    x2={guide.position}
                    y1={guide.start}
                    y2={guide.end}
                  />
                ) : (
                  <line
                    key={index}
                    className={styles.guideLine}
                    x1={guide.start}
                    x2={guide.end}
                    y1={guide.position}
                    y2={guide.position}
                  />
                ),
              )}
            </svg>
          )}
        </div>

        {/* Sibling of `.world`, not inside it — the panel lives in screen
            space, so panning and zooming the scene never drags it along. */}
        {showFloatingPrompt && (
          <CanvasChatPanel
            blocks={scene.blocks}
            selectedBlocks={selectedBlocks}
            onSubmit={commands.submit}
            status={commands.status}
            {...(outcome.kind === 'error' ? { error: outcome.error } : {})}
            {...(floatingLastMessage
              ? { lastMessage: floatingLastMessage, lastMessageVariant: floatingLastMessageVariant }
              : {})}
            {...(commands.thinking ? { thinking: commands.thinking } : {})}
            {...(chatContext !== undefined ? { context: chatContext } : {})}
            disabled={readOnly}
            {...(promptPlaceholder ? { placeholder: promptPlaceholder } : {})}
            boundsRef={surfaceRef}
          />
        )}

        {/* Also a sibling of `.world` — a screen-space control, not scene
            content, so it stays put while the surface pans and zooms
            underneath it. No `AIProvider`/resolver needed, unlike every
            other Canvas affordance. */}
        {shapeToolbar && !readOnly && <CanvasToolbar onInsert={handleToolbarInsert} />}
      </div>

      <CanvasOutline
        scene={scene}
        visible={outlineVisible}
        selectedIds={selectedIds}
        onSelect={(id) => setSelectedIds([id])}
      />

      <VisuallyHidden aria-live="polite" role="status">
        {announcement}
      </VisuallyHidden>
    </div>
  );
});

/**
 * Compound: the parts the canvas renders internally, re-exported for consumers
 * composing a scene by hand — the `Drawer.Header`-is-`Dialog.Header` precedent.
 */
export const Canvas = Object.assign(CanvasRoot, {
  Block: CanvasBlock,
  Connector: CanvasConnector,
  Outline: CanvasOutline,
  displayName: 'Canvas',
});

export { outlineOrder, pointInRect };
