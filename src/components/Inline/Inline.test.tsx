import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Inline } from './Inline';

describe('Inline', () => {
  it('renders as a div by default', () => {
    render(<Inline data-testid="inline">content</Inline>);
    expect(screen.getByTestId('inline').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Inline as="span" data-testid="inline" />);
    expect(screen.getByTestId('inline').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Inline ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Inline data-testid="inline" className="custom" />);
    expect(screen.getByTestId('inline').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Inline>content</Inline>);
    await expectNoA11yViolations(container);
  });

  it('wraps by default and can opt out', () => {
    render(<Inline data-testid="inline" />);
    expect(screen.getByTestId('inline')).toHaveAttribute('data-wrap', 'true');
  });

  it('omits data-wrap when wrap is false', () => {
    render(<Inline data-testid="inline" wrap={false} />);
    expect(screen.getByTestId('inline')).not.toHaveAttribute('data-wrap');
  });

  it('resolves the gap prop to a spacing token', () => {
    render(
      <Inline data-testid="inline" gap="md">
        content
      </Inline>,
    );
    expect(screen.getByTestId('inline')).toHaveStyle({ gap: 'var(--ds-space-md)' });
  });
});
