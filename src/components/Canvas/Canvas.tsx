import { forwardRef, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { CanvasBlock } from '../CanvasBlock/CanvasBlock';
import type { CanvasResizeHandle } from '../CanvasBlock/CanvasBlock';
import { CanvasConnector } from '../CanvasConnector/CanvasConnector';
import { CanvasOutline } from '../CanvasOutline/CanvasOutline';
import { CanvasPromptBar } from '../CanvasPromptBar/CanvasPromptBar';
import { CanvasChangePreview } from '../CanvasChangePreview/CanvasChangePreview';
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
  rectFromPoints,
  rectsIntersect,
  snapToGrid,
} from '../../utilities/canvasGeometry';
import type { CanvasPoint } from '../../utilities/canvasGeometry';
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
    readOnly = false,
    renderBlock,
    viewport: controlledViewport,
    defaultViewport,
    onViewportChange,
    renderBackdrop,
    aiPrompt = false,
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
      setGesture({
        kind: 'pan',
        startX: event.clientX,
        startY: event.clientY,
        panX: viewport.viewport.panX,
        panY: viewport.viewport.panY,
      });
    } else {
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
    // rounding on every frame.
    const starts = new Map<string, { x: number; y: number }>();
    for (const id of next) {
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

      run(
        [...gesture.starts.entries()].map(([id, start]) => ({
          op: 'move' as const,
          id,
          x: snapToGrid(start.x + dx, grid),
          y: snapToGrid(start.y + dy, grid),
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
  }, [viewport]);

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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys aimed at a control inside a block (a note's textarea) belong to it.
    if (editingId) return;

    const primary = selectedIds[0];

    if (event.key === 'Escape') {
      setSelectedIds([]);
      return;
    }

    // ---- viewport keys, ahead of everything else -------------------------
    //
    // Zoom and pan stay available with no selection and in `readOnly`: looking
    // around is not editing. Without these the canvas was pointer-only for
    // navigation, which made every off-screen block unreachable by keyboard.

    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomFromKeyboard(ZOOM_STEP);
      return;
    }

    if (event.key === '-' || event.key === '_') {
      event.preventDefault();
      zoomFromKeyboard(1 / ZOOM_STEP);
      return;
    }

    if (event.key === '0') {
      event.preventDefault();
      viewport.reset();
      announceZoom(1);
      return;
    }

    if (event.key === '1') {
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

    if (event.key === 'PageUp' || event.key === 'PageDown') {
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
    if (panDelta && (!primary || event.ctrlKey || event.metaKey)) {
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
      if (block?.kind === 'sticky') {
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

    const moved = run(
      selectedIds.flatMap((id) => {
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
  const showCluster = aiCluster && commands.clusterAvailable && !readOnly;
  const showDiagram = aiDiagram && commands.diagramAvailable && !readOnly;
  const showAIPanels = showPrompt || showCluster || showDiagram;

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
      {showPrompt && (
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

      {/* A question's answer is shown, not just announced — reading it is the
          entire point of the query path. An applied change carries a message
          too when something was dropped on the way, and that path has no review
          panel to report it in. */}
      {showAIPanels &&
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

          {content.map((block) => (
            <CanvasBlock
              key={block.id}
              block={block}
              selected={selectedIds.includes(block.id)}
              highlighted={highlightedIds.includes(block.id)}
              editing={editingId === block.id}
              resizable={!readOnly}
              aiRewrite={aiRewrite && !readOnly}
              {...(renderBlock ? { renderBlock } : {})}
              onPointerDown={(event) => onBlockPointerDown(event, block)}
              onResizeStart={(event, handle) => onResizeStart(event, block, handle)}
              onDoubleClick={() => {
                if (!readOnly && block.kind === 'sticky') setEditingId(block.id);
              }}
              onTextChange={(text) => run([{ op: 'update', id: block.id, patch: { text } }])}
              onEditingEnd={() => setEditingId(undefined)}
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
        </div>
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
