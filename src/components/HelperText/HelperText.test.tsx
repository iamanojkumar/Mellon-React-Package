import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { HelperText } from './HelperText';

describe('HelperText', () => {
  it('renders as a div by default', () => {
    render(<HelperText data-testid="helper">content</HelperText>);
    expect(screen.getByTestId('helper').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<HelperText as="span" data-testid="helper" />);
    expect(screen.getByTestId('helper').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<HelperText ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<HelperText data-testid="helper" className="custom" />);
    expect(screen.getByTestId('helper').className).toContain('custom');
  });

  it('passes through arbitrary props such as id, for aria-describedby wiring', () => {
    render(<HelperText id="hint">We will never share it</HelperText>);
    expect(screen.getByText('We will never share it')).toHaveAttribute('id', 'hint');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<HelperText>content</HelperText>);
    await expectNoA11yViolations(container);
  });
});
