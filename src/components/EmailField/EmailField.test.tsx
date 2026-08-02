import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { EmailField } from './EmailField';

describe('EmailField', () => {
  it('renders a native input with type=email', () => {
    render(<EmailField aria-label="Email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<EmailField aria-label="Email" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EmailField aria-label="Email" />);
    await expectNoA11yViolations(container);
  });

  it('does not let type be overridden', () => {
    // @ts-expect-error -- type is fixed at "email"
    render(<EmailField aria-label="Email" type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });
});
