import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  it('renders its children', () => {
    render(<MessageBubble>Hello there</MessageBubble>);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MessageBubble ref={ref}>Message</MessageBubble>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(
      <MessageBubble className="custom" data-testid="bubble">
        Message
      </MessageBubble>,
    );
    expect(screen.getByTestId('bubble').className).toContain('custom');
  });

  it('defaults to variant=ai', () => {
    render(<MessageBubble data-testid="bubble">Message</MessageBubble>);
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-variant', 'ai');
  });

  it('applies the given variant', () => {
    render(
      <MessageBubble data-testid="bubble" variant="tool">
        Message
      </MessageBubble>,
    );
    expect(screen.getByTestId('bubble')).toHaveAttribute('data-variant', 'tool');
  });

  it('renders role=alert for the error variant only', () => {
    const { rerender } = render(<MessageBubble variant="error">Failed.</MessageBubble>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<MessageBubble variant="ai">Fine.</MessageBubble>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders an optional avatar slot', () => {
    render(<MessageBubble avatar={<span data-testid="avatar">A</span>}>Message</MessageBubble>);
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('renders no avatar wrapper when avatar is omitted', () => {
    const { container } = render(<MessageBubble>Message</MessageBubble>);
    expect(container.querySelectorAll('div')).toHaveLength(2);
  });

  it('has no accessibility violations for every variant', async () => {
    const variants = ['user', 'ai', 'system', 'tool', 'error', 'status'] as const;
    for (const variant of variants) {
      const { container, unmount } = render(
        <MessageBubble variant={variant}>Message content</MessageBubble>,
      );
      await expectNoA11yViolations(container);
      unmount();
    }
  });
});
