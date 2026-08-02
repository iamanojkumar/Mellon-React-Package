import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { NumberField } from './NumberField';

describe('NumberField', () => {
  it('renders a native input with type=number', () => {
    render(<NumberField aria-label="Quantity" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<NumberField aria-label="Quantity" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<NumberField aria-label="Quantity" />);
    await expectNoA11yViolations(container);
  });

  it('passes min/max/step through', () => {
    render(<NumberField aria-label="Quantity" min={0} max={10} step={2} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '10');
    expect(input).toHaveAttribute('step', '2');
  });

  it('works uncontrolled, tracking its own value', async () => {
    const user = userEvent.setup();
    render(<NumberField aria-label="Quantity" defaultValue="1" />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    expect(input.value).toBe('1');
    await user.type(input, '2');
    expect(input.value).toBe('12');
  });

  it('does not let type be overridden', () => {
    // @ts-expect-error -- type is fixed at "number"
    render(<NumberField aria-label="Quantity" type="text" />);
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
  });
});
