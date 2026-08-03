import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ErrorMessage } from './ErrorMessage';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('ErrorMessage', () => {
  it('renders as a div by default', () => {
    render(<ErrorMessage data-testid="error">content</ErrorMessage>);
    expect(screen.getByTestId('error').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<ErrorMessage as="span" data-testid="error" />);
    expect(screen.getByTestId('error').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ErrorMessage ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<ErrorMessage data-testid="error" className="custom" />);
    expect(screen.getByTestId('error').className).toContain('custom');
  });

  it('passes through arbitrary props such as id, for aria-describedby wiring', () => {
    render(<ErrorMessage id="hint">Enter a valid email address.</ErrorMessage>);
    expect(screen.getByText('Enter a valid email address.')).toHaveAttribute('id', 'hint');
  });

  it('does not add a role by default', () => {
    render(<ErrorMessage data-testid="error">content</ErrorMessage>);
    expect(screen.getByTestId('error')).not.toHaveAttribute('role');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ErrorMessage>content</ErrorMessage>);
    await expectNoA11yViolations(container);
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<ErrorMessage>Enter a valid email address.</ErrorMessage>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<ErrorMessage aiExplain>Enter a valid email address.</ErrorMessage>);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <ErrorMessage aiExplain>Enter a valid email address.</ErrorMessage>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the error text and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const client: AIClient = {
        complete: vi.fn().mockResolvedValue('The address is missing an @ symbol.'),
      };
      render(
        <AIProvider client={client}>
          <ErrorMessage aiExplain>Enter a valid email address.</ErrorMessage>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Enter a valid email address.'),
        }),
      );
      expect(await screen.findByText('The address is missing an @ symbol.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <ErrorMessage aiExplain>Enter a valid email address.</ErrorMessage>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
