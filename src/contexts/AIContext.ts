import { createContext } from 'react';

export interface AICompleteOptions {
  prompt: string;
  /** Opaque pass-through bag (component name, current value, row data, ...) — never inspected by this library, only forwarded to the consumer's `AIClient`. */
  context?: Record<string, unknown>;
  signal?: AbortSignal;
}

export interface AIStreamChunk {
  /** Incremental text since the last chunk (a delta, not the cumulative total) — matches the chunk shape of every major streaming LLM SDK. */
  delta: string;
  done: boolean;
}

/**
 * The contract a consuming application implements and supplies via
 * `AIProvider` — this library never bundles a vendor SDK, API key, or
 * `fetch` call itself, matching the "component stays dumb, consumer owns
 * transport" philosophy already established by `FileUpload`/`DataGrid`.
 */
export interface AIClient {
  complete: (options: AICompleteOptions) => Promise<string>;
  /** Optional — a client that only offers request/response may omit this; `useAIAction` falls back to `complete` and emits a single chunk. */
  stream?: (options: AICompleteOptions) => AsyncIterable<AIStreamChunk>;
}

export const AIContext = createContext<AIClient | undefined>(undefined);
