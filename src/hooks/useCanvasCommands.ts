import { useCallback, useEffect, useRef, useState } from 'react';
import { useAI } from './useAI';
import type { AIActionStatus } from './useAIAction';
import {
  applyCanvasCommands,
  findCanvasBlock,
  validateCanvasCommands,
} from '../utilities/canvasReducer';
import type {
  CanvasBlockData,
  CanvasCommand,
  CanvasRejectedCommand,
  CanvasScene,
} from '../utilities/canvasReducer';
import { canvasSnapshot, buildCanvasPrompt } from '../utilities/canvasSnapshot';
import type { CanvasSnapshot, CanvasSnapshotOptions } from '../utilities/canvasSnapshot';
import { parseCanvasResolution } from '../utilities/canvasResolution';
import type { CanvasResolution } from '../utilities/canvasResolution';
import {
  buildCanvasClusterPrompt,
  clusterCandidates,
  clusterCommands,
  isClusterCandidate,
  normalizeCanvasClusters,
  parseCanvasClusterResolution,
} from '../utilities/canvasClusters';
import type { CanvasClusterOptions, CanvasClusterResolution } from '../utilities/canvasClusters';
import {
  buildCanvasDiagramPrompt,
  diagramCommands,
  isPurelyAdditive,
  normalizeCanvasDiagram,
  parseCanvasDiagramResolution,
} from '../utilities/canvasDiagram';
import type { CanvasDiagramOptions, CanvasDiagramResolution } from '../utilities/canvasDiagram';

export interface CanvasResolveContext {
  prompt: string;
  scene: CanvasScene;
  /** The same budgeted payload the default prompt embeds, for a resolver wanting the structured form. */
  snapshot: CanvasSnapshot;
  signal: AbortSignal;
}

export type CanvasCommandResolver = (
  context: CanvasResolveContext,
) => Promise<CanvasResolution> | CanvasResolution;

export interface CanvasClusterContext {
  scene: CanvasScene;
  snapshot: CanvasSnapshot;
  /** The blocks offered for grouping — the selection, or every text-bearing block. */
  candidates: CanvasBlockData[];
  /** Extra guidance from the caller, e.g. "group by team". */
  instruction?: string;
  signal: AbortSignal;
}

export type CanvasClusterResolver = (
  context: CanvasClusterContext,
) => Promise<CanvasClusterResolution> | CanvasClusterResolution;

export interface CanvasDiagramContext {
  /** What the user asked for, verbatim. */
  request: string;
  scene: CanvasScene;
  snapshot: CanvasSnapshot;
  signal: AbortSignal;
}

export type CanvasDiagramResolver = (
  context: CanvasDiagramContext,
) => Promise<CanvasDiagramResolution> | CanvasDiagramResolution;

export interface CanvasClusterRequest {
  /** Restricts grouping to these blocks. Defaults to every text-bearing block. */
  blockIds?: string[];
  instruction?: string;
}

/** What a prompt turned into. Classification has already happened by the time this lands. */
export type CanvasCommandOutcome =
  | { kind: 'idle' }
  /** A question, not an instruction. Nothing changed. */
  | { kind: 'answer'; message: string; highlightBlockIds: string[] }
  /** Low blast radius: already applied, `previousScene` is the exact undo. */
  | {
      kind: 'applied';
      commands: CanvasCommand[];
      previousScene: CanvasScene;
      message?: string;
    }
  /** Awaiting review. Nothing has touched the scene yet. */
  | {
      kind: 'staged';
      commands: CanvasCommand[];
      rejected: CanvasRejectedCommand[];
      message?: string;
    }
  | { kind: 'error'; error: string };

export interface UseCanvasCommandsOptions {
  scene: CanvasScene;
  onApply: (scene: CanvasScene, commands: CanvasCommand[]) => void;
  /** Consumer-owned transport. Falls back to `AIClient.complete` + text parsing when omitted. */
  resolveCommands?: CanvasCommandResolver;
  /** Consumer-owned transport for clustering. Falls back to `AIClient.complete` + parsing. */
  resolveClusters?: CanvasClusterResolver;
  /** Consumer-owned transport for diagrams. Falls back to `AIClient.complete` + parsing. */
  resolveDiagram?: CanvasDiagramResolver;
  snapshotOptions?: CanvasSnapshotOptions;
  /** Grid spacing and group-count guidance for `cluster`. */
  clusterOptions?: CanvasClusterOptions;
  /** Node size, spacing and direction for `diagram`. */
  diagramOptions?: CanvasDiagramOptions;
  buildPrompt?: (prompt: string, snapshot: CanvasSnapshot) => string;
}

export interface UseCanvasCommandsResult {
  status: AIActionStatus;
  outcome: CanvasCommandOutcome;
  /**
   * The model's own account of its reasoning for the current `outcome`, from
   * `CanvasResolution.thinking`. Only ever set by `submit` — `cluster` and
   * `diagram` resolve to a different shape with no room for it, and clear it
   * so a stale explanation from an earlier prompt can't be shown for a
   * different outcome.
   */
  thinking: string | undefined;
  /** `false` when there's no way to resolve a prompt — the canvas renders no affordance. */
  available: boolean;
  /** `false` when there's no way to resolve a clustering request. */
  clusterAvailable: boolean;
  /** `false` when there's no way to resolve a diagram request. */
  diagramAvailable: boolean;
  submit: (prompt: string) => void;
  /** Affinity-maps blocks into titled frames. Always staged — it moves existing content. */
  cluster: (request?: CanvasClusterRequest) => void;
  /** Draws a described graph as shapes and connectors. Applied with an undo — purely additive. */
  diagram: (request: string) => void;
  acceptStaged: (commands: CanvasCommand[]) => void;
  undo: () => void;
  reset: () => void;
}

/**
 * One prompt's journey: resolve → validate → classify by blast radius → apply
 * or stage. Deliberately the same shape as `useKanbanCommands`, because the
 * policy is the same policy.
 *
 * The canvas does move the line in one place: a lone `create` is treated as
 * low-risk and applied straight away. Adding a block is additive and trivially
 * undone, and making "add a note" open a review panel would make the feature
 * not worth using. Anything that *changes or removes* existing content stays
 * on the cautious side of the line.
 *
 * Validation runs on **every** path, including a consumer's own
 * `resolveCommands` — a model that hallucinated an id is no more trustworthy
 * for having come through someone else's transport.
 *
 * `cluster` and `diagram` sit either side of that line and show why it's drawn
 * where it is: clustering rearranges existing content, so it always stages,
 * while a generated diagram adds content and nothing else, so it applies with
 * an undo.
 *
 * One request in flight per hook instance; a second `submit` — or a `cluster`,
 * or a `diagram` — aborts the first.
 */
export function useCanvasCommands({
  scene,
  onApply,
  resolveCommands,
  resolveClusters,
  resolveDiagram,
  snapshotOptions,
  clusterOptions,
  diagramOptions,
  buildPrompt = buildCanvasPrompt,
}: UseCanvasCommandsOptions): UseCanvasCommandsResult {
  const client = useAI();
  const [status, setStatus] = useState<AIActionStatus>('idle');
  const [outcome, setOutcome] = useState<CanvasCommandOutcome>({ kind: 'idle' });
  const [thinking, setThinking] = useState<string | undefined>(undefined);
  const controllerRef = useRef<AbortController | undefined>(undefined);

  // Read through refs inside the async flow so a scene that changed while the
  // request was in flight isn't overwritten from a stale snapshot.
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  const outcomeRef = useRef<CanvasCommandOutcome>(outcome);
  outcomeRef.current = outcome;

  const available = Boolean(resolveCommands) || Boolean(client);
  const clusterAvailable = Boolean(resolveClusters) || Boolean(client);
  const diagramAvailable = Boolean(resolveDiagram) || Boolean(client);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus('idle');
    setOutcome({ kind: 'idle' });
    setThinking(undefined);
  }, []);

  const classify = useCallback((resolution: CanvasResolution): CanvasCommandOutcome => {
    const current = sceneRef.current;
    const { applied: valid, rejected } = validateCanvasCommands(current, resolution.commands);

    if (resolution.commands.length === 0) {
      return {
        kind: 'answer',
        message: resolution.message ?? 'No changes suggested.',
        highlightBlockIds: resolution.highlightBlockIds ?? [],
      };
    }

    // Everything proposed failed validation — show why rather than reporting
    // "nothing to do".
    if (valid.length === 0) {
      return {
        kind: 'staged',
        commands: [],
        rejected,
        ...(resolution.message ? { message: resolution.message } : {}),
      };
    }

    const first = valid[0];
    const additiveOnly = valid.length === 1 && first?.op === 'create';
    const destructive = valid.some((command) => command.op === 'delete');

    if (additiveOnly && !destructive && rejected.length === 0) {
      const result = applyCanvasCommands(current, valid);
      onApplyRef.current(result.scene, result.applied);
      return {
        kind: 'applied',
        commands: result.applied,
        previousScene: current,
        ...(resolution.message ? { message: resolution.message } : {}),
      };
    }

    return {
      kind: 'staged',
      commands: valid,
      rejected,
      ...(resolution.message ? { message: resolution.message } : {}),
    };
  }, []);

  const submit = useCallback(
    (prompt: string) => {
      if (!available || !prompt.trim()) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      setOutcome({ kind: 'idle' });
      setThinking(undefined);

      const current = sceneRef.current;
      const snapshot = canvasSnapshot(current, snapshotOptions);

      const resolve = async (): Promise<CanvasResolution> => {
        if (resolveCommands) {
          return resolveCommands({ prompt, scene: current, snapshot, signal: controller.signal });
        }
        const text = await client!.complete({
          prompt: buildPrompt(prompt, snapshot),
          context: { component: 'Canvas', scene: snapshot },
          signal: controller.signal,
        });
        return parseCanvasResolution(text);
      };

      resolve()
        .then((resolution) => {
          if (controller.signal.aborted) return;
          setThinking(resolution.thinking);
          setOutcome(classify(resolution));
          setStatus('done');
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setOutcome({
            kind: 'error',
            error: caught instanceof Error ? caught.message : String(caught),
          });
          setStatus('error');
        });
    },
    [available, client, resolveCommands, snapshotOptions, buildPrompt, classify],
  );

  /**
   * Affinity mapping, sharing this hook's single in-flight slot and single
   * outcome with the prompt bar — so a cluster and a prompt can't both be
   * resolving, and both land in the same review panel.
   *
   * The model is asked only *which blocks belong together*; `clusterCommands`
   * decides where they go. That keeps the response small enough to validate
   * properly and the geometry deterministic, and it means the result reaches
   * the scene through the same commands a drag would produce.
   */
  const cluster = useCallback(
    (request?: CanvasClusterRequest) => {
      if (!clusterAvailable) return;

      const current = sceneRef.current;
      const candidates = request?.blockIds
        ? request.blockIds
            .map((id) => findCanvasBlock(current, id))
            .filter((block): block is CanvasBlockData => block !== undefined)
            .filter(isClusterCandidate)
        : clusterCandidates(current);

      // One block is already its own group. Answered rather than silently
      // ignored: the user pressed a button and is owed a reason.
      if (candidates.length < 2) {
        controllerRef.current?.abort();
        setStatus('done');
        setOutcome({
          kind: 'answer',
          message: 'There are at least two notes needed to group.',
          highlightBlockIds: [],
        });
        setThinking(undefined);
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      setOutcome({ kind: 'idle' });
      setThinking(undefined);

      const snapshot = canvasSnapshot(current, snapshotOptions);
      const candidateIds = candidates.map((block) => block.id);

      const resolve = async (): Promise<CanvasClusterResolution> => {
        if (resolveClusters) {
          return resolveClusters({
            scene: current,
            snapshot,
            candidates,
            ...(request?.instruction ? { instruction: request.instruction } : {}),
            signal: controller.signal,
          });
        }
        const text = await client!.complete({
          prompt: buildCanvasClusterPrompt(snapshot, {
            candidateIds,
            ...(clusterOptions?.maxGroups !== undefined
              ? { maxGroups: clusterOptions.maxGroups }
              : {}),
            ...(request?.instruction ? { instruction: request.instruction } : {}),
          }),
          context: { component: 'Canvas', mode: 'cluster', scene: snapshot },
          signal: controller.signal,
        });
        return parseCanvasClusterResolution(text);
      };

      resolve()
        .then((resolution) => {
          if (controller.signal.aborted) return;
          const latest = sceneRef.current;
          const { groups, dropped } = normalizeCanvasClusters(
            latest,
            resolution.groups,
            candidateIds,
          );
          const commands = clusterCommands(latest, groups, clusterOptions);

          // What normalization dropped rides in the message rather than in
          // `rejected`, which only holds real commands — inventing one just to
          // report a hallucinated id would put a fake change in the preview.
          const message = [resolution.message, ...dropped.map((drop) => drop.reason)]
            .filter(Boolean)
            .join(' ');

          setOutcome(classify({ commands, ...(message ? { message } : {}) }));
          setStatus('done');
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setOutcome({
            kind: 'error',
            error: caught instanceof Error ? caught.message : String(caught),
          });
          setStatus('error');
        });
    },
    [clusterAvailable, client, resolveClusters, snapshotOptions, clusterOptions, classify],
  );

  /**
   * Draws a described graph.
   *
   * Unlike `cluster`, this **applies immediately with an undo**, because a
   * generated diagram touches nothing that was already on the canvas — it is
   * the multi-command case that is genuinely additive. Staging it would ask the
   * user to approve twelve "Add shape" lines they can't evaluate as text, when
   * the thing they wanted to look at is the drawing itself, one undo away.
   *
   * The additive claim is *checked*, not assumed: anything that turns out to
   * touch existing content falls back to the review panel.
   */
  const diagram = useCallback(
    (request: string) => {
      if (!diagramAvailable || !request.trim()) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      setOutcome({ kind: 'idle' });
      setThinking(undefined);

      const current = sceneRef.current;
      const snapshot = canvasSnapshot(current, snapshotOptions);

      const resolve = async (): Promise<CanvasDiagramResolution> => {
        if (resolveDiagram) {
          return resolveDiagram({ request, scene: current, snapshot, signal: controller.signal });
        }
        const text = await client!.complete({
          prompt: buildCanvasDiagramPrompt(request, snapshot, {
            ...(diagramOptions?.maxNodes !== undefined
              ? { maxNodes: diagramOptions.maxNodes }
              : {}),
          }),
          context: { component: 'Canvas', mode: 'diagram', scene: snapshot },
          signal: controller.signal,
        });
        return parseCanvasDiagramResolution(text);
      };

      resolve()
        .then((resolution) => {
          if (controller.signal.aborted) return;
          const latest = sceneRef.current;
          const { diagram: normalized, dropped } = normalizeCanvasDiagram(resolution, {
            ...(diagramOptions?.maxNodes !== undefined
              ? { maxNodes: diagramOptions.maxNodes }
              : {}),
          });
          const commands = diagramCommands(latest, normalized, diagramOptions);
          const notes = [resolution.message, ...dropped.map((drop) => drop.reason)]
            .filter(Boolean)
            .join(' ');

          if (commands.length === 0) {
            setOutcome({
              kind: 'answer',
              message: notes || 'Nothing to draw from that.',
              highlightBlockIds: [],
            });
            setStatus('done');
            return;
          }

          if (!isPurelyAdditive(latest, commands)) {
            setOutcome(classify({ commands, ...(notes ? { message: notes } : {}) }));
            setStatus('done');
            return;
          }

          const result = applyCanvasCommands(latest, commands);
          onApplyRef.current(result.scene, result.applied);
          setOutcome({
            kind: 'applied',
            commands: result.applied,
            previousScene: latest,
            ...(notes ? { message: notes } : {}),
          });
          setStatus('done');
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setOutcome({
            kind: 'error',
            error: caught instanceof Error ? caught.message : String(caught),
          });
          setStatus('error');
        });
    },
    [diagramAvailable, client, resolveDiagram, snapshotOptions, diagramOptions, classify],
  );

  const acceptStaged = useCallback((commands: CanvasCommand[]) => {
    if (commands.length === 0) {
      setOutcome({ kind: 'idle' });
      setStatus('idle');
      return;
    }
    const current = sceneRef.current;
    const result = applyCanvasCommands(current, commands);
    onApplyRef.current(result.scene, result.applied);
    setOutcome({ kind: 'applied', commands: result.applied, previousScene: current });
    setStatus('done');
  }, []);

  // Reads the current outcome from a ref rather than a state updater: an
  // updater can run twice under StrictMode, and restoring a scene is a side
  // effect that must happen exactly once.
  const undo = useCallback(() => {
    const previous = outcomeRef.current;
    if (previous.kind !== 'applied') return;
    onApplyRef.current(previous.previousScene, []);
    setOutcome({ kind: 'idle' });
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return {
    status,
    outcome,
    thinking,
    available,
    clusterAvailable,
    diagramAvailable,
    submit,
    cluster,
    diagram,
    acceptStaged,
    undo,
    reset,
  };
}
