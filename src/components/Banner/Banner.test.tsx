import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Banner } from './Banner';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Banner', () => {
  it('renders children', () => {
    render(<Banner>A new version is available.</Banner>);
    expect(screen.getByText('A new version is available.')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Banner ref={ref}>Message</Banner>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Banner variant="warning">Message</Banner>);
    await expectNoA11yViolations(container);
  });

  it('defaults to variant=info', () => {
    render(<Banner>Message</Banner>);
    expect(screen.getByRole('status')).toHaveAttribute('data-variant', 'info');
  });

  it('uses role=status for info/success and role=alert for warning/danger', () => {
    const { rerender } = render(<Banner variant="success">Message</Banner>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Banner variant="danger">Message</Banner>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render a dismiss button by default', () => {
    render(<Banner>Message</Banner>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button and calls onDismiss when clicked', async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<Banner onDismiss={onDismiss}>Message</Banner>);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalled();
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Banner variant="danger">Something broke.</Banner>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(
        <Banner variant="danger" aiExplain>
          Something broke.
        </Banner>,
      );
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger alongside the dismiss button when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Banner variant="danger" aiExplain onDismiss={() => {}}>
            Something broke.
          </Banner>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
    });

    it('triggers the AI client on open and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('This happens when the upstream service is slow.'),
      };
      render(
        <AIProvider client={client}>
          <Banner variant="danger" aiExplain>
            The request timed out.
          </Banner>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('The request timed out.') }),
      );
      expect(
        await screen.findByText('This happens when the upstream service is slow.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Banner variant="danger" aiExplain>
            Something broke.
          </Banner>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
