import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ChartContainer } from './ChartContainer';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const data = [
  { label: 'Jan', value: 10 },
  { label: 'Feb', value: 20 },
];

function Plot() {
  return <svg aria-hidden="true" data-testid="plot" />;
}

describe('ChartContainer', () => {
  it('renders as a figure with the label as its caption', () => {
    render(
      <ChartContainer label="Monthly revenue" data={data}>
        <Plot />
      </ChartContainer>,
    );
    const figure = screen.getByRole('figure');
    expect(figure).toBeInTheDocument();
    expect(within(figure).getByText('Monthly revenue')).toBeInTheDocument();
  });

  it('forwards a ref to the figure', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ChartContainer ref={ref} label="Revenue" data={data}>
        <Plot />
      </ChartContainer>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('FIGURE');
  });

  it('renders the description when given', () => {
    render(
      <ChartContainer label="Revenue" description="In USD, before tax" data={data}>
        <Plot />
      </ChartContainer>,
    );
    expect(screen.getByText('In USD, before tax')).toBeInTheDocument();
  });

  // The table is the chart's real accessible content — the SVG is aria-hidden,
  // so without this a screen reader gets an empty figure.
  describe('accessible table twin', () => {
    it('renders every datum as a table row', () => {
      render(
        <ChartContainer label="Revenue" data={data}>
          <Plot />
        </ChartContainer>,
      );
      const table = screen.getByRole('table');
      expect(within(table).getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
      expect(within(table).getByRole('cell', { name: '10' })).toBeInTheDocument();
      expect(within(table).getByRole('rowheader', { name: 'Feb' })).toBeInTheDocument();
      expect(within(table).getByRole('cell', { name: '20' })).toBeInTheDocument();
    });

    it('labels the table with the chart caption', () => {
      render(
        <ChartContainer label="Monthly revenue" data={data}>
          <Plot />
        </ChartContainer>,
      );
      expect(screen.getByRole('table', { name: 'Monthly revenue' })).toBeInTheDocument();
    });

    it('applies custom column headings', () => {
      render(
        <ChartContainer label="Revenue" data={data} categoryHeading="Month" valueHeading="USD">
          <Plot />
        </ChartContainer>,
      );
      expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'USD' })).toBeInTheDocument();
    });

    it('formats values with formatValue', () => {
      render(
        <ChartContainer label="Revenue" data={data} formatValue={(v) => `$${v}.00`}>
          <Plot />
        </ChartContainer>,
      );
      expect(screen.getByRole('cell', { name: '$10.00' })).toBeInTheDocument();
    });

    it('is present but visually hidden when tableToggle is false', () => {
      render(
        <ChartContainer label="Revenue" data={data}>
          <Plot />
        </ChartContainer>,
      );
      // Still in the a11y tree — hidden visually, not from assistive tech.
      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByTestId('plot')).toBeVisible();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('tableToggle', () => {
    it('swaps the plot for the table and back', async () => {
      const user = userEvent.setup();
      render(
        <ChartContainer label="Revenue" data={data} tableToggle>
          <Plot />
        </ChartContainer>,
      );

      const toggle = screen.getByRole('button', { name: 'Show data table' });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('plot')).toBeVisible();

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(toggle).toHaveTextContent('Show chart');
      expect(screen.getByRole('table')).toBeVisible();
      expect(screen.getByTestId('plot')).not.toBeVisible();

      await user.click(toggle);

      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('plot')).toBeVisible();
    });

    it('points aria-controls at the table it toggles', () => {
      render(
        <ChartContainer label="Revenue" data={data} tableToggle>
          <Plot />
        </ChartContainer>,
      );
      const controls = screen.getByRole('button').getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls as string)).not.toBeNull();
    });
  });

  it('renders an empty series without crashing', () => {
    render(
      <ChartContainer label="Revenue" data={[]}>
        <Plot />
      </ChartContainer>,
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <ChartContainer label="Monthly revenue" data={data}>
        <Plot />
      </ChartContainer>,
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations with the table toggle', async () => {
    const { container } = render(
      <ChartContainer label="Monthly revenue" data={data} tableToggle>
        <Plot />
      </ChartContainer>,
    );
    await expectNoA11yViolations(container);
  });

  describe('aiExplain', () => {
    it('renders no AI trigger when aiExplain is omitted', () => {
      render(
        <ChartContainer label="Revenue" data={data}>
          <Plot />
        </ChartContainer>,
      );
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    // The load-bearing rule: an AI affordance is inert without a provider,
    // not broken.
    it('renders no AI trigger when aiExplain is true but no AIProvider is mounted', () => {
      render(
        <ChartContainer label="Revenue" data={data} aiExplain>
          <Plot />
        </ChartContainer>,
      );
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger alongside the table toggle when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <ChartContainer label="Revenue" data={data} aiExplain tableToggle>
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show data table' })).toBeInTheDocument();
    });

    // A chart has real structured data, so unlike Table there is no reason to
    // scrape the rendered DOM for it.
    it('builds the prompt from the series', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('Revenue doubled.') };
      render(
        <AIProvider client={client}>
          <ChartContainer
            label="Monthly revenue"
            description="In thousands of USD"
            data={data}
            aiExplain
          >
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));

      const prompt = vi.mocked(client.complete).mock.calls[0]![0]!.prompt;
      expect(prompt).toContain('Monthly revenue');
      expect(prompt).toContain('In thousands of USD');
      expect(prompt).toContain('Jan: 10');
      expect(prompt).toContain('Feb: 20');

      await screen.findByText('Revenue doubled.');
    });

    it('forwards the series as structured context, not only as prose', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('ok') };
      render(
        <AIProvider client={client}>
          <ChartContainer label="Revenue" data={data} aiExplain>
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ context: expect.objectContaining({ data }) }),
      );
    });

    it('describes a missing reading as missing rather than sending NaN', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('ok') };
      render(
        <AIProvider client={client}>
          <ChartContainer
            label="Revenue"
            data={[
              { label: 'Jan', value: 10 },
              { label: 'Feb', value: Number.NaN },
            ]}
            aiExplain
          >
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      const prompt = vi.mocked(client.complete).mock.calls[0]![0]!.prompt;
      expect(prompt).toContain('Feb: no data');
      expect(prompt).not.toContain('NaN');
    });

    it('states values through formatValue, so the prompt matches what is on screen', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('ok') };
      render(
        <AIProvider client={client}>
          <ChartContainer
            label="Revenue"
            data={data}
            formatValue={(value) => `$${value}k`}
            aiExplain
          >
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(vi.mocked(client.complete).mock.calls[0]![0]!.prompt).toContain('Jan: $10k');
    });

    it('accepts a custom prompt builder', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('ok') };
      render(
        <AIProvider client={client}>
          <ChartContainer
            label="Revenue"
            data={data}
            aiExplain
            buildAIPrompt={(options) =>
              `Summarise ${options.data.length} points from ${options.label}`
            }
          >
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      expect(client.complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: 'Summarise 2 points from Revenue' }),
      );
    });

    // Read-only: the chart's data comes from the caller, so there is nothing
    // an accepted suggestion could be written back into.
    it('offers no accept/reject actions', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockResolvedValue('Revenue doubled.') };
      render(
        <AIProvider client={client}>
          <ChartContainer label="Revenue" data={data} aiExplain>
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      await screen.findByText('Revenue doubled.');
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('surfaces a failure with a retry', async () => {
      const user = userEvent.setup();
      const client: AIClient = { complete: vi.fn().mockRejectedValue(new Error('Model offline')) };
      render(
        <AIProvider client={client}>
          <ChartContainer label="Revenue" data={data} aiExplain>
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Explain with AI' }));
      await screen.findByText('Model offline');
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <ChartContainer label="Revenue" data={data} aiExplain>
            <Plot />
          </ChartContainer>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
