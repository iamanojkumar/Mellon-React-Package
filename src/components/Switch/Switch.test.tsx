import { describe, expect, it, vi } from 'vitest';
import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders a native checkbox input with role=switch', () => {
    render(<Switch aria-label="Airplane mode" />);
    const el = screen.getByRole('switch');
    expect(el).toBeInstanceOf(HTMLInputElement);
    expect(el).toHaveAttribute('type', 'checkbox');
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch aria-label="Airplane mode" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Switch label="Airplane mode" />);
    await expectNoA11yViolations(container);
  });

  it('is off by default', () => {
    render(<Switch aria-label="Airplane mode" />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('works uncontrolled, toggling from defaultChecked', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Airplane mode" defaultChecked />);
    const el = screen.getByRole('switch');
    expect(el).toBeChecked();
    await user.click(el);
    expect(el).not.toBeChecked();
  });

  it('works controlled, deferring to the checked prop', async () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return <Switch aria-label="Airplane mode" checked={checked} onCheckedChange={setChecked} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const el = screen.getByRole('switch');
    expect(el).not.toBeChecked();
    await user.click(el);
    expect(el).toBeChecked();
  });

  it('calls onCheckedChange with the new boolean', async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Switch aria-label="Airplane mode" onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole('switch'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles via the keyboard (native checkbox Space handling)', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Airplane mode" />);
    const el = screen.getByRole('switch');
    el.focus();
    await user.keyboard(' ');
    expect(el).toBeChecked();
  });

  it('renders the label and toggles when clicking it', async () => {
    const user = userEvent.setup();
    render(<Switch label="Airplane mode" />);
    const el = screen.getByRole('switch', { name: 'Airplane mode' });
    await user.click(screen.getByText('Airplane mode'));
    expect(el).toBeChecked();
  });

  it('is disabled when the disabled prop is set', () => {
    render(<Switch aria-label="Airplane mode" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });
});
