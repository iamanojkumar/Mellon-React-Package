import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAIAction } from './useAIAction';
import { AIProvider } from '../providers/AIProvider';
import type { AIClient, AIStreamChunk } from '../contexts/AIContext';

function withClient(client: AIClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AIProvider client={client}>{children}</AIProvider>;
  };
}

describe('useAIAction', () => {
  it('trigger is a no-op when no AIProvider is mounted', () => {
    const { result } = renderHook(() => useAIAction());
    act(() => {
      result.current.trigger({ prompt: 'hello' });
    });
    expect(result.current.status).toBe('idle');
  });

  it('resolves complete() into a done result', async () => {
    const client: AIClient = { complete: vi.fn().mockResolvedValue('rewritten text') };
    const { result } = renderHook(() => useAIAction(), { wrapper: withClient(client) });

    act(() => {
      result.current.trigger({ prompt: 'rewrite this' });
    });
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.result).toBe('rewritten text');
    expect(client.complete).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: 'rewrite this' }),
    );
  });

  it('rejects complete() into an error result', async () => {
    const client: AIClient = { complete: vi.fn().mockRejectedValue(new Error('boom')) };
    const { result } = renderHook(() => useAIAction(), { wrapper: withClient(client) });

    act(() => {
      result.current.trigger({ prompt: 'rewrite this' });
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('boom');
  });

  it('accumulates stream() chunks and reaches done', async () => {
    let resolveSecondChunk: (() => void) | undefined;
    const secondChunkGate = new Promise<void>((resolve) => {
      resolveSecondChunk = resolve;
    });

    async function* stream(): AsyncGenerator<AIStreamChunk> {
      yield { delta: 'Hello ', done: false };
      await secondChunkGate;
      yield { delta: 'world', done: true };
    }

    const client: AIClient = { complete: vi.fn(), stream: () => stream() };
    const { result } = renderHook(() => useAIAction({ stream: true }), {
      wrapper: withClient(client),
    });

    act(() => {
      result.current.trigger({ prompt: 'continue writing' });
    });

    await waitFor(() => expect(result.current.result).toBe('Hello '));
    expect(result.current.status).toBe('streaming');

    resolveSecondChunk?.();
    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.result).toBe('Hello world');
  });

  it('cancel stops further state updates without setting an error', async () => {
    let resolveChunk: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      resolveChunk = resolve;
    });

    async function* stream(): AsyncGenerator<AIStreamChunk> {
      await gate;
      yield { delta: 'too late', done: true };
    }

    const client: AIClient = { complete: vi.fn(), stream: () => stream() };
    const { result } = renderHook(() => useAIAction({ stream: true }), {
      wrapper: withClient(client),
    });

    act(() => {
      result.current.trigger({ prompt: 'continue writing' });
    });
    act(() => {
      result.current.cancel();
    });
    resolveChunk?.();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current.status).toBe('streaming');
    expect(result.current.result).toBe('');
  });

  it('reset clears status/result/error back to idle', async () => {
    const client: AIClient = { complete: vi.fn().mockResolvedValue('text') };
    const { result } = renderHook(() => useAIAction(), { wrapper: withClient(client) });

    act(() => {
      result.current.trigger({ prompt: 'x' });
    });
    await waitFor(() => expect(result.current.status).toBe('done'));

    act(() => {
      result.current.reset();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBe('');
    expect(result.current.error).toBeUndefined();
  });
});
