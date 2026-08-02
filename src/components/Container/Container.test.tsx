import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Container } from './Container';

describe('Container', () => {
  it('renders as a div by default', () => {
    render(<Container data-testid="container">content</Container>);
    expect(screen.getByTestId('container').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Container as="main" data-testid="container" />);
    expect(screen.getByTestId('container').tagName).toBe('MAIN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Container ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Container data-testid="container" className="custom" />);
    expect(screen.getByTestId('container').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Container>content</Container>);
    await expectNoA11yViolations(container);
  });

  it('defaults to maxWidth=lg and paddingX=md', () => {
    render(<Container data-testid="container">content</Container>);
    const el = screen.getByTestId('container');
    expect(el).toHaveAttribute('data-max-width', 'lg');
    expect(el).toHaveStyle({ paddingInline: 'var(--ds-space-md)' });
  });

  it('applies the maxWidth prop as a data attribute', () => {
    render(
      <Container data-testid="container" maxWidth="sm">
        content
      </Container>,
    );
    expect(screen.getByTestId('container')).toHaveAttribute('data-max-width', 'sm');
  });
});
