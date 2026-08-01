import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Input } from './Input';

describe('Input', () => {
  it('renders a native input element', () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole('textbox')).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards the ref to the underlying element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Name" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('merges a custom className with the base style', () => {
    render(<Input aria-label="Name" className="custom" />);
    expect(screen.getByRole('textbox').className).toContain('custom');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Input aria-label="Name" />);
    await expectNoA11yViolations(container);
  });

  it('defaults to size=md', () => {
    render(<Input aria-label="Name" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'md');
  });

  it('sets aria-invalid and data-invalid when invalid', () => {
    render(<Input aria-label="Name" invalid />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid', 'true');
  });

  it('works uncontrolled, tracking its own value from defaultValue', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Name" defaultValue="hi" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('hi');
    await user.type(input, '!');
    expect(input.value).toBe('hi!');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('start');
      return <Input aria-label="Name" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('start');
    await user.type(input, '!');
    expect(input.value).toBe('start!');
  });

  it('calls onChange with the native ChangeEvent', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input aria-label="Name" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'a' }) }),
    );
  });
});
