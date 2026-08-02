import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Center } from './Center';

describe('Center', () => {
  it('renders as a div by default', () => {
    render(<Center data-testid="center">content</Center>);
    expect(screen.getByTestId('center').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<Center as="section" data-testid="center" />);
    expect(screen.getByTestId('center').tagName).toBe('SECTION');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Center ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Center data-testid="center" className="custom" />);
    expect(screen.getByTestId('center').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Center>content</Center>);
    await expectNoA11yViolations(container);
  });

  it('omits data-inline by default', () => {
    render(<Center data-testid="center" />);
    expect(screen.getByTestId('center')).not.toHaveAttribute('data-inline');
  });

  it('sets data-inline when inline is true', () => {
    render(<Center data-testid="center" inline />);
    expect(screen.getByTestId('center')).toHaveAttribute('data-inline', 'true');
  });
});
