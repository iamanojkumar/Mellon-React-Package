import { describe, expect, it, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Timeline } from './Timeline';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

function BasicTimeline() {
  return (
    <Timeline>
      <Timeline.Item time="9:00 AM" title="Order placed" color="brand">
        We received your order.
      </Timeline.Item>
      <Timeline.Item time="10:30 AM" title="Shipped" color="warning" />
      <Timeline.Item time="Today" title="Delivered" color="success">
        Left at the front door.
      </Timeline.Item>
    </Timeline>
  );
}

describe('Timeline', () => {
  it('renders as an ordered list with one item per entry', () => {
    render(<BasicTimeline />);
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('renders title, time, and description content', () => {
    render(<BasicTimeline />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('We received your order.')).toBeInTheDocument();
  });

  it('renders an item with no description', () => {
    render(<BasicTimeline />);
    expect(screen.getByText('Shipped')).toBeInTheDocument();
  });

  it('applies the marker color as a data attribute', () => {
    render(<BasicTimeline />);
    const item = screen.getByText('Order placed').closest('li');
    expect(item?.querySelector('[data-color="brand"]')).toBeInTheDocument();
  });

  it('defaults to vertical orientation', () => {
    render(<BasicTimeline />);
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'vertical');
  });

  it('accepts a horizontal orientation', () => {
    render(
      <Timeline orientation="horizontal">
        <Timeline.Item title="One" />
        <Timeline.Item title="Two" />
      </Timeline>,
    );
    expect(screen.getByRole('list')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('renders custom icon content in the marker', () => {
    render(
      <Timeline>
        <Timeline.Item title="Custom" icon={<span data-testid="custom-icon">*</span>} />
      </Timeline>,
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('forwards a ref to the underlying <ol>', () => {
    const ref = createRef<HTMLOListElement>();
    render(
      <Timeline ref={ref}>
        <Timeline.Item title="One" />
      </Timeline>,
    );
    expect(ref.current).toBeInstanceOf(HTMLOListElement);
  });

  it('merges a custom className with the base style on the root', () => {
    render(
      <Timeline className="custom">
        <Timeline.Item title="One" />
      </Timeline>,
    );
    expect(screen.getByRole('list').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicTimeline />);
    await expectNoA11yViolations(container);
  });

  describe('aiSummarize', () => {
    it('renders no AI trigger when aiSummarize is omitted', () => {
      render(<BasicTimeline />);
      expect(screen.queryByRole('button', { name: 'Summarize with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiSummarize is true but no AIProvider is mounted', () => {
      render(
        <Timeline aiSummarize>
          <Timeline.Item time="9:00 AM" title="Order placed">
            We received your order.
          </Timeline.Item>
        </Timeline>,
      );
      expect(screen.queryByRole('button', { name: 'Summarize with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <Timeline aiSummarize>
            <Timeline.Item time="9:00 AM" title="Order placed">
              We received your order.
            </Timeline.Item>
          </Timeline>
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Summarize with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with each item serialized and has no accept/reject actions (read-only)', async () => {
      const user = userEvent.setup();
      const complete = vi.fn().mockResolvedValue('The order was placed and then delivered.');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <Timeline aiSummarize>
            <Timeline.Item time="9:00 AM" title="Order placed">
              We received your order.
            </Timeline.Item>
            <Timeline.Item time="Today" title="Delivered">
              Left at the front door.
            </Timeline.Item>
          </Timeline>
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Summarize with AI' }));
      const prompt = complete.mock.calls[0]?.[0].prompt as string;
      expect(prompt).toContain('Order placed');
      expect(prompt).toContain('Delivered');
      expect(
        await screen.findByText('The order was placed and then delivered.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Discard' })).not.toBeInTheDocument();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <Timeline aiSummarize>
            <Timeline.Item time="9:00 AM" title="Order placed">
              We received your order.
            </Timeline.Item>
          </Timeline>
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
