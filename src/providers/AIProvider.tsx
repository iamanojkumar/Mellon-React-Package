import type { ReactNode } from 'react';
import { AIContext } from '../contexts/AIContext';
import type { AIClient } from '../contexts/AIContext';

export interface AIProviderProps {
  children?: ReactNode;
  /** The consuming app's own AI implementation — this library never bundles one. */
  client: AIClient;
}

export function AIProvider({ children, client }: AIProviderProps) {
  return <AIContext.Provider value={client}>{children}</AIContext.Provider>;
}
