import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { OTPInput } from './OTPInput';

function segments(): HTMLInputElement[] {
  return screen.getAllByRole('textbox') as HTMLInputElement[];
}

function nth(index: number): HTMLInputElement {
  const segment = segments()[index];
  if (!segment) throw new Error(`No segment at index ${index}`);
  return segment;
}

describe('OTPInput', () => {
  it('renders `length` segments (defaults to 6)', () => {
    render(<OTPInput aria-label="Verification code" />);
    expect(segments()).toHaveLength(6);
  });

  it('supports a custom length', () => {
    render(<OTPInput aria-label="Verification code" length={4} />);
    expect(segments()).toHaveLength(4);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<OTPInput aria-label="Verification code" />);
    await expectNoA11yViolations(container);
  });

  it('each segment has a distinguishing accessible name', () => {
    render(<OTPInput aria-label="Verification code" length={3} />);
    expect(screen.getByRole('textbox', { name: 'Digit 1 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Digit 2 of 3' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Digit 3 of 3' })).toBeInTheDocument();
  });

  it('reflects defaultValue across segments', () => {
    render(<OTPInput aria-label="Verification code" length={4} defaultValue="12" />);
    expect(nth(0).value).toBe('1');
    expect(nth(1).value).toBe('2');
    expect(nth(2).value).toBe('');
    expect(nth(3).value).toBe('');
  });

  it('auto-advances focus to the next segment after typing a valid character', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} />);
    nth(0).focus();
    await user.keyboard('5');
    expect(nth(0).value).toBe('5');
    expect(nth(1)).toHaveFocus();
  });

  it('rejects non-numeric characters by default', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} />);
    nth(0).focus();
    await user.keyboard('a');
    expect(nth(0).value).toBe('');
  });

  it('allows letters when characterType="alphanumeric"', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} characterType="alphanumeric" />);
    nth(0).focus();
    await user.keyboard('a');
    expect(nth(0).value).toBe('a');
  });

  it('calls onChange with the full joined string', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} onChange={onChange} />);
    nth(0).focus();
    await user.keyboard('7');
    expect(onChange).toHaveBeenCalledWith('7');
  });

  it('calls onComplete once every segment is filled', async () => {
    const onComplete = vi.fn();
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <OTPInput
        aria-label="Verification code"
        length={3}
        onChange={onChange}
        onComplete={onComplete}
      />,
    );
    nth(0).focus();
    await user.keyboard('123');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('123');
  });

  it('backspace on an empty segment clears and focuses the previous segment', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} defaultValue="12" />);
    nth(2).focus();
    await user.keyboard('{Backspace}');
    expect(nth(1).value).toBe('');
    expect(nth(1)).toHaveFocus();
    expect(nth(0).value).toBe('1');
  });

  it('backspace on a filled segment just clears that segment (native behavior)', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={4} defaultValue="12" />);
    nth(1).focus();
    await user.keyboard('{Backspace}');
    expect(nth(1).value).toBe('');
    expect(nth(1)).toHaveFocus();
  });

  it('moves focus with ArrowLeft/ArrowRight', async () => {
    const user = userEvent.setup();
    render(<OTPInput aria-label="Verification code" length={3} defaultValue="123" />);
    nth(0).focus();
    await user.keyboard('{ArrowRight}');
    expect(nth(1)).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(nth(2)).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(nth(1)).toHaveFocus();
  });

  it('distributes a pasted code across segments starting at the focused one', () => {
    render(<OTPInput aria-label="Verification code" length={6} />);
    nth(0).focus();
    fireEvent.paste(nth(0), { clipboardData: { getData: () => '123456' } });
    const values = segments().map((s) => s.value);
    expect(values).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('filters non-matching characters out of a pasted value', () => {
    render(<OTPInput aria-label="Verification code" length={6} />);
    nth(0).focus();
    fireEvent.paste(nth(0), { clipboardData: { getData: () => '12-34a56' } });
    const values = segments().map((s) => s.value);
    expect(values).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('focusing a segment beyond the first empty one redirects focus back', () => {
    render(<OTPInput aria-label="Verification code" length={4} defaultValue="1" />);
    fireEvent.focus(nth(3));
    expect(nth(1)).toHaveFocus();
  });

  it('allows re-focusing an already-filled segment to edit it', () => {
    render(<OTPInput aria-label="Verification code" length={4} defaultValue="123" />);
    // A real `.focus()` call, not `fireEvent.focus()` — the latter only
    // dispatches the synthetic event without moving real DOM focus, so it
    // can't tell "focus succeeded and stuck" apart from "focus was
    // redirected elsewhere" the way a real `.focus()` call can.
    nth(0).focus();
    expect(nth(0)).toHaveFocus();
  });

  it('masks each segment with type=password when mask is set', () => {
    render(<OTPInput aria-label="PIN" length={4} mask defaultValue="1" />);
    const inputs = document.querySelectorAll('input');
    expect(inputs[0]).toHaveAttribute('type', 'password');
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <OTPInput aria-label="Verification code" length={4} value={value} onChange={setValue} />
      );
    }
    const user = userEvent.setup();
    render(<Controlled />);
    nth(0).focus();
    await user.keyboard('9');
    expect(nth(0).value).toBe('9');
  });

  it('disables all segments when disabled', () => {
    render(<OTPInput aria-label="Verification code" disabled />);
    for (const segment of segments()) {
      expect(segment).toBeDisabled();
    }
  });
});
