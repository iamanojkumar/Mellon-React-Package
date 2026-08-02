import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders a native checkbox input', () => {
    render(<Checkbox aria-label="Accept terms" />);
    expect(screen.getByRole('checkbox')).toBeInstanceOf(HTMLInputElement);
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox aria-label="Accept terms" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" label="Accept terms" />);
    await expectNoA11yViolations(container);
  });

  it('is unchecked by default', () => {
    render(<Checkbox aria-label="Accept terms" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('works uncontrolled, toggling from defaultChecked', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept terms" defaultChecked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('works controlled, deferring to the checked prop', async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return <Checkbox aria-label="Accept terms" checked={checked} onCheckedChange={setChecked} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('calls onCheckedChange with the new boolean', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept terms" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('sets the indeterminate DOM property and aria-checked=mixed', () => {
    render(<Checkbox aria-label="Select all" indeterminate />);
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
  });

  it('renders the label next to the box and toggles on click', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' });
    await user.click(screen.getByText('Accept terms'));
    expect(checkbox).toBeChecked();
  });

  it('sets aria-invalid when invalid', () => {
    render(<Checkbox aria-label="Accept terms" invalid />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Checkbox aria-label="Accept terms" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
