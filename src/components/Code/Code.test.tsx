import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Code } from './Code';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Code', () => {
  it('renders as a code element by default', () => {
    render(<Code data-testid="code">const x = 1;</Code>);
    expect(screen.getByTestId('code').tagName).toBe('CODE');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Code as="pre" data-testid="code" />);
    expect(screen.getByTestId('code').tagName).toBe('PRE');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLElement>();
    render(<Code ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Code data-testid="code" className="custom" />);
    expect(screen.getByTestId('code').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Code>const x = 1;</Code>);
    await expectNoA11yViolations(container);
  });

  it('omits data-block by default', () => {
    render(<Code data-testid="code">content</Code>);
    expect(screen.getByTestId('code')).not.toHaveAttribute('data-block');
  });

  it('sets data-block when block is true', () => {
    render(
      <Code data-testid="code" block>
        content
      </Code>,
    );
    expect(screen.getByTestId('code')).toHaveAttribute('data-block', 'true');
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Code>const x = 1;</Code>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<Code aiExplain>const x = 1;</Code>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Code aiExplain>const x = 1;</Code>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the code text and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('This declares a constant.'),
      };
      render(
        <AIProvider client={client}>
          <Code aiExplain>const x = 1;</Code>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('const x = 1;') }),
      );
      expect(await screen.findByText('This declares a constant.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Code aiExplain>const x = 1;</Code>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
