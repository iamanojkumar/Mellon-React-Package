import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FormGroup } from './FormGroup';

describe('FormGroup', () => {
  it('renders as a div', () => {
    render(<FormGroup data-testid="group">content</FormGroup>);
    expect(screen.getByTestId('group').tagName).toBe('DIV');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FormGroup ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<FormGroup data-testid="group" className="custom" />);
    expect(screen.getByTestId('group').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<FormGroup>content</FormGroup>);
    await expectNoA11yViolations(container);
  });

  it('defaults to a gap of md', () => {
    render(<FormGroup data-testid="group" />);
    expect(screen.getByTestId('group')).toHaveStyle({ gap: 'var(--ds-space-md)' });
  });

  it('resolves the gap prop to a spacing token', () => {
    render(<FormGroup data-testid="group" gap="lg" />);
    expect(screen.getByTestId('group')).toHaveStyle({ gap: 'var(--ds-space-lg)' });
  });
});
