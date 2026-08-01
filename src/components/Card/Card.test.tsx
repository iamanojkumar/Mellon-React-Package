import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Card } from './Card';

describe('Card', () => {
  it('renders as a div by default', () => {
    render(<Card data-testid="card">content</Card>);
    expect(screen.getByTestId('card').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Card as="section" data-testid="card" />);
    expect(screen.getByTestId('card').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Card data-testid="card" className="custom" />);
    expect(screen.getByTestId('card').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Card>content</Card>);
    await expectNoA11yViolations(container);
  });

  it('resolves the padding prop to a spacing token, defaulting to md', () => {
    render(<Card data-testid="card">content</Card>);
    expect(screen.getByTestId('card')).toHaveStyle({ padding: 'var(--ds-space-md)' });
  });

  it('defaults to variant=elevated and elevation=sm', () => {
    render(<Card data-testid="card">content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-variant', 'elevated');
    expect(card).toHaveAttribute('data-elevation', 'sm');
  });

  it('omits data-elevation for the outlined variant', () => {
    render(
      <Card variant="outlined" data-testid="card">
        content
      </Card>,
    );
    expect(screen.getByTestId('card')).not.toHaveAttribute('data-elevation');
  });
});
