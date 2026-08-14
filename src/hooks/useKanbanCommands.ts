import { useCallback, useEffect, useRef, useState } from 'react';
import { useAI } from './useAI';
import type { AIActionStatus } from './useAIAction';
import { applyKanbanCommands, validateKanbanCommands } from '../utilities/kanbanReducer';
import type {
  KanbanBoardData,
  KanbanCommand,
  KanbanRejectedCommand,
} from '../utilities/kanbanReducer';
import { kanbanSnapshot, buildKanbanPrompt } from '../utilities/kanbanSnapshot';
import type { KanbanSnapshot, KanbanSnapshotOptions } from '../utilities/kanbanSnapshot';
import { parseKanbanResolution } from '../utilities/kanbanResolution';
import type { KanbanResolution } from '../utilities/kanbanResolution';

export interface KanbanResolveContext {
  prompt: string;
  board: KanbanBoardData;
  /** The same budgeted payload the default prompt embeds, for a resolver that wants the structured form. */
  snapshot: KanbanSnapshot;
  signal: AbortSignal;
}

export type KanbanCommandResolver = (
  context: KanbanResolveContext,
) => Promise<KanbanResolution> | KanbanResolution;

/**
 * What a prompt turned into. The board reads this to decide what to render —
 * the classification has already happened by the time it lands here.
 */
export type KanbanCommandOutcome =
  | { kind: 'idle' }
  /** A question, not an instruction. Nothing was changed. */
  | { kind: 'answer'; message: string; highlightCardIds: string[] }
  /** Low blast radius: already applied, `previousBoard` is the exact undo. */
  | {
      kind: 'applied';
      commands: KanbanCommand[];
      previousBoard: KanbanBoardData;
      message?: string;
    }
  /** Awaiting review. Nothing has touched the board yet. */
  | {
      kind: 'staged';
      commands: KanbanCommand[];
      rejected: KanbanRejectedCommand[];
      message?: string;
    }
  | { kind: 'error'; error: string };

export interface UseKanbanCommandsOptions {
  board: KanbanBoardData;
  /** Called with the next board and the commands that produced it. */
  onApply: (board: KanbanBoardData, commands: KanbanCommand[]) => void;
  /** Consumer-owned transport (tool-calling, JSON mode, a server round-trip). Falls back to `AIClient.complete` + text parsing when omitted. */
  resolveCommands?: KanbanCommandResolver;
  snapshotOptions?: KanbanSnapshotOptions;
  buildPrompt?: (prompt: string, snapshot: KanbanSnapshot) => string;
}

export interface UseKanbanCommandsResult {
  status: AIActionStatus;
  outcome: KanbanCommandOutcome;
  /** `false` when there's no way to resolve a prompt — the board renders no affordance at all. */
  available: boolean;
  submit: (prompt: string) => void;
  /** Applies a reviewed subset of a staged batch. */
  acceptStaged: (commands: KanbanCommand[]) => void;
  /** Puts the board back to `previousBoard` after an auto-applied change. */
  undo: () => void;
  reset: () => void;
}

/**
 * One prompt's journey: resolve → validate → classify by blast radius →
 * apply or stage.
 *
 * The classification is the whole point. Treating every response the same way
 * either makes "what's blocked?" pop a scary confirmation dialog, or lets
 * "tidy up the backlog" rewrite forty cards before anyone sees it. So:
 *
 * - no commands → an answer, nothing touched
 * - one non-destructive command → applied, with an exact undo
 * - anything else, or any delete → staged for review, board untouched
 *
 * Validation runs on **every** path, including a consumer's own
 * `resolveCommands`, because a model that hallucinated a card id is not more
 * trustworthy for having come through someone else's transport.
 *
 * Like `useAIAction`, one request in flight per hook instance — a second
 * `submit` aborts the first rather than queueing.
 */
export function useKanbanCommands({
  board,
  onApply,
  resolveCommands,
  snapshotOptions,
  buildPrompt = buildKanbanPrompt,
}: UseKanbanCommandsOptions): UseKanbanCommandsResult {
  const client = useAI();
  const [status, setStatus] = useState<AIActionStatus>('idle');
  const [outcome, setOutcome] = useState<KanbanCommandOutcome>({ kind: 'idle' });
  const controllerRef = useRef<AbortController | undefined>(undefined);

  // Read through refs inside the async flow so a board that changed while the
  // request was in flight doesn't get overwritten by a stale snapshot.
  const boardRef = useRef(board);
  boardRef.current = board;
  const onApplyRef = useRef(onApply);
  onApplyRef.current = onApply;
  const outcomeRef = useRef<KanbanCommandOutcome>(outcome);
  outcomeRef.current = outcome;

  const available = Boolean(resolveCommands) || Boolean(client);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus('idle');
    setOutcome({ kind: 'idle' });
  }, []);

  const classify = useCallback((resolution: KanbanResolution): KanbanCommandOutcome => {
    const current = boardRef.current;
    const { applied: valid, rejected } = validateKanbanCommands(current, resolution.commands);

    if (resolution.commands.length === 0) {
      return {
        kind: 'answer',
        message: resolution.message ?? 'No changes suggested.',
        highlightCardIds: resolution.highlightCardIds ?? [],
      };
    }

    // Everything the model proposed failed validation — show why rather than
    // silently reporting "nothing to do".
    if (valid.length === 0) {
      return {
        kind: 'staged',
        commands: [],
        rejected,
        ...(resolution.message ? { message: resolution.message } : {}),
      };
    }

    const destructive = valid.some((command) => command.op === 'delete');
    if (valid.length === 1 && !destructive && rejected.length === 0) {
      const result = applyKanbanCommands(current, valid);
      onApplyRef.current(result.board, result.applied);
      return {
        kind: 'applied',
        commands: result.applied,
        previousBoard: current,
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

      const current = boardRef.current;
      const snapshot = kanbanSnapshot(current, snapshotOptions);

      const resolve = async (): Promise<KanbanResolution> => {
        if (resolveCommands) {
          return resolveCommands({ prompt, board: current, snapshot, signal: controller.signal });
        }
        const text = await client!.complete({
          prompt: buildPrompt(prompt, snapshot),
          context: { component: 'KanbanBoard', board: snapshot },
          signal: controller.signal,
        });
        return parseKanbanResolution(text);
      };

      resolve()
        .then((resolution) => {
          if (controller.signal.aborted) return;
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

  const acceptStaged = useCallback((commands: KanbanCommand[]) => {
    if (commands.length === 0) {
      setOutcome({ kind: 'idle' });
      setStatus('idle');
      return;
    }
    const current = boardRef.current;
    const result = applyKanbanCommands(current, commands);
    onApplyRef.current(result.board, result.applied);
    setOutcome({ kind: 'applied', commands: result.applied, previousBoard: current });
    setStatus('done');
  }, []);

  // Read the current outcome from a ref rather than a state updater: an
  // updater can be invoked twice under StrictMode, and restoring a board is a
  // side effect that must happen exactly once.
  const undo = useCallback(() => {
    const previous = outcomeRef.current;
    if (previous.kind !== 'applied') return;
    onApplyRef.current(previous.previousBoard, []);
    setOutcome({ kind: 'idle' });
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { status, outcome, available, submit, acceptStaged, undo, reset };
}
