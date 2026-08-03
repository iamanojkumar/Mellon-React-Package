import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Paragraph } from './Paragraph';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Paragraph', () => {
  it('renders as a p by default', () => {
    render(<Paragraph data-testid="paragraph">content</Paragraph>);
    expect(screen.getByTestId('paragraph').tagName).toBe('P');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Paragraph as="div" data-testid="paragraph" />);
    expect(screen.getByTestId('paragraph').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLParagraphElement>();
    render(<Paragraph ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Paragraph data-testid="paragraph" className="custom" />);
    expect(screen.getByTestId('paragraph').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Paragraph>content</Paragraph>);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md, weight=regular, color=primary', () => {
    render(<Paragraph data-testid="paragraph">content</Paragraph>);
    const el = screen.getByTestId('paragraph');
    expect(el).toHaveAttribute('data-size', 'md');
    expect(el).toHaveAttribute('data-weight', 'regular');
    expect(el).toHaveAttribute('data-color', 'primary');
  });

  describe('aiSummarize', () => {
    it('renders no AI trigger when aiSummarize is omitted', () => {
      render(<Paragraph>Some body copy.</Paragraph>);
      expect(screen.queryByRole('button', { name: 'Summarize with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiSummarize is true but no AIProvider is mounted', () => {
      render(<Paragraph aiSummarize>Some body copy.</Paragraph>);
      expect(screen.queryByRole('button', { name: 'Summarize with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Paragraph aiSummarize>Some body copy.</Paragraph>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Summarize with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the text and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('A short summary.'),
      };
      render(
        <AIProvider client={client}>
          <Paragraph aiSummarize>Some body copy.</Paragraph>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Summarize with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('Some body copy.') }),
      );
      expect(await screen.findByText('A short summary.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Paragraph aiSummarize>Some body copy.</Paragraph>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
