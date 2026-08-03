import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Statistic } from './Statistic';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('Statistic', () => {
  it('renders as a div', () => {
    render(<Statistic data-testid="stat" label="Revenue" value="$12,000" />);
    expect(screen.getByTestId('stat').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Statistic ref={ref} label="Revenue" value="$12,000" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Statistic data-testid="stat" className="custom" label="Revenue" value="$12,000" />);
    expect(screen.getByTestId('stat').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Statistic label="Revenue" value="$12,000" trend="up" trendValue="+12%" />,
    );
    await expectNoA11yViolations(container);
  });

  it('renders the label and value', () => {
    render(<Statistic label="Revenue" value="$12,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$12,000')).toBeInTheDocument();
  });

  it('does not render a trend row when trend is not given', () => {
    render(<Statistic label="Revenue" value="$12,000" />);
    expect(screen.queryByText('+12%')).not.toBeInTheDocument();
  });

  it('renders the trend value when trend is given', () => {
    render(<Statistic label="Revenue" value="$12,000" trend="up" trendValue="+12%" />);
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(<Statistic label="Revenue" value="$12,000" />);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(<Statistic label="Revenue" value="$12,000" aiExplain />);
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Statistic label="Revenue" value="$12,000" aiExplain />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with label/value/trend and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('Revenue grew due to a seasonal spike.');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <Statistic label="Revenue" value="$12,000" trend="up" trendValue="+12%" aiExplain />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      const prompt = complete.mock.calls[0]?.[0].prompt as string;
      expect(prompt).toContain('Revenue');
      expect(prompt).toContain('$12,000');
      expect(await screen.findByText('Revenue grew due to a seasonal spike.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Statistic label="Revenue" value="$12,000" aiExplain />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
