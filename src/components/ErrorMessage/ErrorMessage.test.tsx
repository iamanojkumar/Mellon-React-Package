import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ErrorMessage } from './ErrorMessage';

describe('ErrorMessage', () => {
  it('renders as a div by default', () => {
    render(<ErrorMessage data-testid="error">content</ErrorMessage>);
    expect(screen.getByTestId('error').tagName).toBe('DIV');
  });

  it('renders as the element passed via the "as" prop', () => {
    render(<ErrorMessage as="span" data-testid="error" />);
    expect(screen.getByTestId('error').tagName).toBe('SPAN');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ErrorMessage ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a custom className with the base style', () => {
    render(<ErrorMessage data-testid="error" className="custom" />);
    expect(screen.getByTestId('error').className).toContain('custom');
  });

  it('passes through arbitrary props such as id, for aria-describedby wiring', () => {
    render(<ErrorMessage id="hint">Enter a valid email address.</ErrorMessage>);
    expect(screen.getByText('Enter a valid email address.')).toHaveAttribute('id', 'hint');
  });

  it('does not add a role by default', () => {
    render(<ErrorMessage data-testid="error">content</ErrorMessage>);
    expect(screen.getByTestId('error')).not.toHaveAttribute('role');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ErrorMessage>content</ErrorMessage>);
    await expectNoA11yViolations(container);
  });
});
