import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Stack } from './Stack';

describe('Stack', () => {
  it('renders as a div by default', () => {
    render(<Stack data-testid="stack">content</Stack>);
    expect(screen.getByTestId('stack').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Stack as="section" data-testid="stack" />);
    expect(screen.getByTestId('stack').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Stack ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Stack data-testid="stack" className="custom" />);
    expect(screen.getByTestId('stack').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Stack>content</Stack>);
    await expectNoA11yViolations(container);
  });

  it('resolves the gap prop to a spacing token', () => {
    render(<Stack data-testid="stack" gap="md" />);
    expect(screen.getByTestId('stack')).toHaveStyle({ gap: 'var(--ds-space-md)' });
  });

  it('resolves the align prop to alignItems', () => {
    render(<Stack data-testid="stack" align="center" />);
    expect(screen.getByTestId('stack')).toHaveStyle({ alignItems: 'center' });
  });
});
