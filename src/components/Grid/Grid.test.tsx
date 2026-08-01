import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Grid } from './Grid';

describe('Grid', () => {
  it('renders as a div by default', () => {
    render(<Grid data-testid="grid">content</Grid>);
    expect(screen.getByTestId('grid').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Grid as="section" data-testid="grid" />);
    expect(screen.getByTestId('grid').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Grid ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Grid data-testid="grid" className="custom" />);
    expect(screen.getByTestId('grid').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Grid>content</Grid>);
    await expectNoA11yViolations(container);
  });

  it('resolves a numeric columns value to an equal-width template', () => {
    render(<Grid data-testid="grid" columns={3} />);
    expect(screen.getByTestId('grid')).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });

  it('accepts a raw string columns value', () => {
    render(<Grid data-testid="grid" columns="1fr 2fr" />);
    expect(screen.getByTestId('grid')).toHaveStyle({ gridTemplateColumns: '1fr 2fr' });
  });

  it('resolves gap and autoFlow', () => {
    render(<Grid data-testid="grid" gap="md" autoFlow="column" />);
    expect(screen.getByTestId('grid')).toHaveStyle({
      gap: 'var(--ds-space-md)',
      gridAutoFlow: 'column',
    });
  });
});
