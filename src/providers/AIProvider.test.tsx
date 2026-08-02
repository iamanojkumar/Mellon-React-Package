import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIProvider } from './AIProvider';
import { useAI } from '../hooks/useAI';
import type { AIClient } from '../contexts/AIContext';

function AIConsumer() {
  const client = useAI();
  return <span data-testid="status">{client ? 'has-client' : 'no-client'}</span>;
}

describe('AIProvider', () => {
  it('renders children', () => {
    render(
      <AIProvider client={{ complete: vi.fn() }}>
        <span data-testid="child">content</span>
      </AIProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('exposes the supplied client via useAI', () => {
    const client: AIClient = { complete: vi.fn() };
    render(
      <AIProvider client={client}>
        <AIConsumer />
      </AIProvider>,
    );
    expect(screen.getByTestId('status')).toHaveTextContent('has-client');
  });

  it('useAI returns undefined outside an AIProvider (no throw)', () => {
    render(<AIConsumer />);
    expect(screen.getByTestId('status')).toHaveTextContent('no-client');
  });
});
