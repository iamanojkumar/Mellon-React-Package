import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { MessageMeta } from './MessageMeta';

describe('MessageMeta', () => {
  it('renders the sender', () => {
    render(<MessageMeta sender="Jordan Lee" />);
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MessageMeta ref={ref} sender="Jordan Lee" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<MessageMeta sender="Jordan Lee" className="custom" data-testid="meta" />);
    expect(screen.getByTestId('meta').className).toContain('custom');
  });

  it('renders no timestamp when omitted', () => {
    render(<MessageMeta sender="Jordan Lee" data-testid="meta" />);
    expect(screen.getByTestId('meta').textContent).toBe('Jordan Lee');
  });

  it('renders a pre-formatted timestamp node as-is', () => {
    render(<MessageMeta sender="Jordan Lee" timestamp="2 minutes ago" />);
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
  });

  it('formats a Date timestamp via toLocaleTimeString', () => {
    const date = new Date('2026-08-03T14:05:00');
    const expected = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    render(<MessageMeta sender="Jordan Lee" timestamp={date} />);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<MessageMeta sender="Jordan Lee" timestamp="2 minutes ago" />);
    await expectNoA11yViolations(container);
  });
});
