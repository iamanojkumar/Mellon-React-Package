import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Box } from './Box';

describe('Box', () => {
  it('renders as a div by default', () => {
    render(<Box data-testid="box">content</Box>);
    expect(screen.getByTestId('box').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Box as="section" data-testid="box" />);
    expect(screen.getByTestId('box').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Box ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('resolves spacing tokens to CSS variables', () => {
    render(<Box data-testid="box" p="md" />);
    expect(screen.getByTestId('box')).toHaveStyle({ padding: 'var(--ds-space-md)' });
  });

  it('accepts raw CSS length values for spacing', () => {
    render(<Box data-testid="box" p="12px" />);
    expect(screen.getByTestId('box')).toHaveStyle({ padding: '12px' });
  });

  it('accepts numeric spacing values as pixels', () => {
    render(<Box data-testid="box" m={8} />);
    expect(screen.getByTestId('box')).toHaveStyle({ margin: '8px' });
  });

  it('merges a custom className with the base style', () => {
    render(<Box data-testid="box" className="custom" />);
    expect(screen.getByTestId('box').className).toContain('custom');
  });
});
