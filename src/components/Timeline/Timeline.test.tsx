import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Timeline } from './Timeline';

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
});
