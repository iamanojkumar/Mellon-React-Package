import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Blockquote } from './Blockquote';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Blockquote', () => {
  it('renders as a blockquote by default', () => {
    render(<Blockquote data-testid="quote">content</Blockquote>);
    expect(screen.getByTestId('quote').tagName).toBe('BLOCKQUOTE');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Blockquote as="div" data-testid="quote" />);
    expect(screen.getByTestId('quote').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLQuoteElement>();
    render(<Blockquote ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLQuoteElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Blockquote data-testid="quote" className="custom" />);
    expect(screen.getByTestId('quote').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Blockquote>content</Blockquote>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md and color=secondary', () => {
    render(<Blockquote data-testid="quote">content</Blockquote>);
    const el = screen.getByTestId('quote');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-color', 'secondary');
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Blockquote>Design is how it works.</Blockquote>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<Blockquote aiExplain>Design is how it works.</Blockquote>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Blockquote aiExplain>Design is how it works.</Blockquote>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the quote text and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('This quote is about functional design.'),
      };
      render(
        <AIProvider client={client}>
          <Blockquote aiExplain>Design is how it works.</Blockquote>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Design is how it works.') }),
      );
      expect(await screen.findByText('This quote is about functional design.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Blockquote aiExplain>Design is how it works.</Blockquote>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
