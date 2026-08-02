import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Alert } from './Alert';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Alert', () => {
  it('renders children as the description', () => {
    render(<Alert>Something happened.</Alert>);
    expect(screen.getByText('Something happened.')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref}>Message</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('renders an optional title', () => {
    render(<Alert title="Heads up">Details here.</Alert>);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Details here.')).toBeInTheDocument();
  });

  it('has no accessibility violations for every variant', async () => {
    const { rerender, container } = render(
      <Alert variant="info" title="Info">
        Message
      </Alert>,
    );
    await expectNoA11yViolations(container);
    rerender(
      <Alert variant="success" title="Success">
        Message
      </Alert>,
    );
    await expectNoA11yViolations(container);
    rerender(
      <Alert variant="warning" title="Warning">
        Message
      </Alert>,
    );
    await expectNoA11yViolations(container);
    rerender(
      <Alert variant="danger" title="Danger">
        Message
      </Alert>,
    );
    await expectNoA11yViolations(container);
  });

  it('uses role=status for info and success (polite)', () => {
    const { rerender } = render(<Alert variant="info">Message</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Alert variant="success">Message</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('uses role=alert for warning and danger (urgent)', () => {
    const { rerender } = render(<Alert variant="warning">Message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Alert variant="danger">Message</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('defaults to variant=info', () => {
    render(<Alert>Message</Alert>);
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'info');
  });

  it('does not render a dismiss button by default', () => {
    render(<Alert>Message</Alert>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button and calls onDismiss when clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Alert onDismiss={onDismiss}>Message</Alert>);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('supports a custom dismissLabel', () => {
    render(
      <Alert onDismiss={() => {}} dismissLabel="Close alert">
        Message
      </Alert>,
    );
    expect(screen.getByRole('button', { name: 'Close alert' })).toBeInTheDocument();
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Alert variant="danger">Something broke.</Alert>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(
        <Alert variant="danger" aiExplain>
          Something broke.
        </Alert>,
      );
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger alongside the dismiss button when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Alert variant="danger" aiExplain onDismiss={() => {}}>
            Something broke.
          </Alert>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('triggers the AI client on open and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('This times out because the upstream service is slow.'),
      };
      render(
        <AIProvider client={client}>
          <Alert variant="danger" title="Request failed" aiExplain>
            The request timed out.
          </Alert>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('The request timed out.') }),
      );

      await screen.findByText('This times out because the upstream service is slow.');
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });
  });
});
