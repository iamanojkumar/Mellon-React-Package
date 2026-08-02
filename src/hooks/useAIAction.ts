import { useCallback, useEffect, useRef, useState } from 'react';
import { useAI } from './useAI';
import type { AICompleteOptions } from '../contexts/AIContext';

export type AIActionStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export interface UseAIActionOptions {
  /** Use the client's `stream` method when available. Defaults to `false` (uses `complete`). */
  stream?: boolean;
}

export interface UseAIActionResult {
  status: AIActionStatus;
  /** Accumulated text — the full result once `'done'`, partial while `'streaming'`. */
  result: string;
  error: string | undefined;
  trigger: (options: AICompleteOptions) => void;
  /** Aborts an in-flight request. Does not surface an error — cancellation is deliberate, not a failure. */
  cancel: () => void;
  reset: () => void;
}

/**
 * Per-instance request lifecycle for a single AI action (rewrite, explain,
 * ask, ...). Extends `FileUpload`'s `'pending' | 'uploading' | 'done' |
 * 'error'` status vocabulary with `'streaming'`, the closest existing
 * async-state precedent in this codebase.
 *
 * `trigger` is a no-op when no `AIProvider` is mounted (`useAI()` returns
 * `undefined`) — this is what makes every AI affordance built on this hook
 * inert, not broken, in an app that hasn't opted in.
 *
 * No global job queue (unlike `ToastProvider`'s queue) — deliberately scoped
 * to one in-flight request per hook instance; a second `trigger()` call
 * aborts the previous one rather than queuing.
 */
export function useAIAction(options?: UseAIActionOptions): UseAIActionResult {
  const client = useAI();
  const useStream = options?.stream ?? false;

  const [status, setStatus] = useState<AIActionStatus>('idle');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  const controllerRef = useRef<AbortController | undefined>(undefined);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setStatus('idle');
    setResult('');
    setError(undefined);
  }, []);

  const trigger = useCallback(
    (triggerOptions: AICompleteOptions) => {
      if (!client) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setResult('');
      setError(undefined);

      const requestOptions: AICompleteOptions = { ...triggerOptions, signal: controller.signal };

      if (useStream && client.stream) {
        setStatus('streaming');
        (async () => {
          try {
            for await (const chunk of client.stream!(requestOptions)) {
              if (controller.signal.aborted) return;
              setResult((previous) => previous + chunk.delta);
            }
            if (!controller.signal.aborted) setStatus('done');
          } catch (caught) {
            if (controller.signal.aborted) return;
            setError(caught instanceof Error ? caught.message : String(caught));
            setStatus('error');
          }
        })();
        return;
      }

      setStatus('loading');
      client
        .complete(requestOptions)
        .then((text) => {
          if (controller.signal.aborted) return;
          setResult(text);
          setStatus('done');
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setError(caught instanceof Error ? caught.message : String(caught));
          setStatus('error');
        });
    },
    [client, useStream],
  );

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { status, result, error, trigger, cancel, reset };
}
