import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { PinInput } from './PinInput';

function segments(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll('input'));
}

function nth(index: number): HTMLInputElement {
  const segment = segments()[index];
  if (!segment) throw new Error(`No segment at index ${index}`);
  return segment;
}

describe('PinInput', () => {
  it('defaults length to 4', () => {
    render(<PinInput aria-label="PIN" />);
    expect(segments()).toHaveLength(4);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PinInput aria-label="PIN" />);
    await expectNoA11yViolations(container);
  });

  it('allows overriding length', () => {
    render(<PinInput aria-label="PIN" length={6} />);
    expect(segments()).toHaveLength(6);
  });

  it('masks every segment with type=password', () => {
    render(<PinInput aria-label="PIN" />);
    for (const segment of segments()) {
      expect(segment).toHaveAttribute('type', 'password');
    }
  });

  it('cannot have masking turned off via props', () => {
    // @ts-expect-error -- mask isn't part of PinInputProps
    render(<PinInput aria-label="PIN" mask={false} />);
    expect(nth(0)).toHaveAttribute('type', 'password');
  });

  it('auto-advances focus and calls onComplete once filled', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(<PinInput aria-label="PIN" onComplete={onComplete} />);
    nth(0).focus();
    await user.keyboard('1234');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('is disabled when the disabled prop is set', () => {
    render(<PinInput aria-label="PIN" disabled />);
    for (const segment of segments()) {
      expect(segment).toBeDisabled();
    }
  });
});
