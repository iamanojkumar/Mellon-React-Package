import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { TypingIndicator } from './TypingIndicator';

describe('TypingIndicator', () => {
  it('renders as a span', () => {
    render(<TypingIndicator data-testid="typing" />);
    expect(screen.getByTestId('typing').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<TypingIndicator ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<TypingIndicator data-testid="typing" className="custom" />);
    expect(screen.getByTestId('typing').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<TypingIndicator />);
    await expectNoA11yViolations(container);
  });

  it('has role="status" with a default accessible label of "Typing"', () => {
    render(<TypingIndicator />);
    expect(screen.getByRole('status', { name: 'Typing' })).toBeInTheDocument();
  });

  it('uses a custom label', () => {
    render(<TypingIndicator label="Mellon AI is typing" />);
    expect(screen.getByRole('status', { name: 'Mellon AI is typing' })).toBeInTheDocument();
  });

  it('defaults to size=md', () => {
    render(<TypingIndicator data-testid="typing" />);
    expect(screen.getByTestId('typing')).toHaveAttribute('data-size', 'md');
  });

  it('renders three dots', () => {
    render(<TypingIndicator data-testid="typing" />);
    expect(screen.getByTestId('typing').children).toHaveLength(3);
  });
});
