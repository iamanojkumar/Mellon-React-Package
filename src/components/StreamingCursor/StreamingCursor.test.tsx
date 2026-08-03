import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { StreamingCursor } from './StreamingCursor';

describe('StreamingCursor', () => {
  it('renders as a span', () => {
    render(<StreamingCursor data-testid="cursor" />);
    expect(screen.getByTestId('cursor').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<StreamingCursor ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('merges a custom className with the base style', () => {
    render(<StreamingCursor data-testid="cursor" className="custom" />);
    expect(screen.getByTestId('cursor').className).toContain('custom');
  });

  it('is aria-hidden (purely decorative)', () => {
    render(<StreamingCursor data-testid="cursor" />);
    expect(screen.getByTestId('cursor')).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<StreamingCursor />);
    await expectNoA11yViolations(container);
  });
});
