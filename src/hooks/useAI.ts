import { useContext } from 'react';
import { AIContext } from '../contexts/AIContext';
import type { AIClient } from '../contexts/AIContext';

/**
 * Returns the ancestor `AIProvider`'s client, or `undefined` when there
 * isn't one — unlike `useTheme`/`useToast`, this doesn't throw. AI is an
 * opt-in enhancement layer, not core infra every app must wrap; components
 * using this must degrade to their non-AI rendering, the same non-throwing
 * shape `useFieldContext` uses for the same reason.
 */
export function useAI(): AIClient | undefined {
  return useContext(AIContext);
}
