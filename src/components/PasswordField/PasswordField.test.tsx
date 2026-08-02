import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { PasswordField } from './PasswordField';

describe('PasswordField', () => {
  it('renders a native input with type=password by default', () => {
    render(<PasswordField aria-label="Password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('forwards the ref to the underlying input element', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PasswordField aria-label="Password" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PasswordField aria-label="Password" />);
    await expectNoA11yViolations(container);
  });

  it('toggles between password and text on button click', async () => {
    const user = userEvent.setup();
    render(<PasswordField aria-label="Password" defaultValue="secret" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('sets aria-pressed on the toggle to reflect visibility', async () => {
    const user = userEvent.setup();
    render(<PasswordField aria-label="Password" />);
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports custom toggle labels', () => {
    render(<PasswordField aria-label="Password" showLabel="Reveal" hideLabel="Conceal" />);
    expect(screen.getByRole('button', { name: 'Reveal' })).toBeInTheDocument();
  });
});
