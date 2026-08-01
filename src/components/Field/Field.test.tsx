import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Field } from './Field';
import { Input } from '../Input/Input';

describe('Field', () => {
  it('associates the label with the control via id/htmlFor', () => {
    render(
      <Field label="Email">
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Field label="Email" helperText="We will never share it">
        <Input />
      </Field>,
    );
    await expectNoA11yViolations(container);
  });

  it('wires helperText via aria-describedby', () => {
    render(
      <Field label="Email" helperText="We will never share it">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      'We will never share it',
    );
  });

  it('marks the control invalid and shows errorMessage instead of helperText when both are set', () => {
    render(
      <Field label="Email" helperText="helper" errorMessage="Required">
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Required');
    expect(screen.queryByText('helper')).not.toBeInTheDocument();
  });

  it('propagates disabled and required to the control', () => {
    render(
      <Field label="Email" disabled required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
  });

  it('shows a visible required indicator', () => {
    render(
      <Field label="Email" required>
        <Input />
      </Field>,
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
