import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Card } from './Card';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Card', () => {
  it('renders as a div by default', () => {
    render(<Card data-testid="card">content</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Card as="section" data-testid="card" />);
    expect(screen.getByTestId('card').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Card data-testid="card" className="custom" />);
    expect(screen.getByTestId('card').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Card>content</Card>);
    await expectNoA11yViolations(container);
  });

  it('resolves the padding prop to a spacing token, defaulting to md', () => {
    render(<Card data-testid="card">content</Card>);
    expect(screen.getByTestId('card')).toHaveStyle({ padding: 'var(--ds-space-md)' });
  });

  it('defaults to variant=elevated and elevation=sm', () => {
    render(<Card data-testid="card">content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'elevated');
    expect(card).toHaveAttribute('data-elevation', 'sm');
  });

  it('omits data-elevation for the outlined variant', () => {
    render(
      <Card variant="outlined" data-testid="card">
        content
      </Card>,
    );
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-elevation');
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Card>Some card content.</Card>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<Card aiExplain>Some card content.</Card>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Card aiExplain>Some card content.</Card>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the text and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('A short summary.'),
      };
      render(
        <AIProvider client={client}>
          <Card aiExplain>Some card content.</Card>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Some card content.') }),
      );
      expect(await screen.findByText('A short summary.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Card aiExplain>Some card content.</Card>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
