import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEscapeKey } from './useEscapeKey';

function Demo({ active, onEscape }: { active: boolean; onEscape: () => void }) {
  useEscapeKey(onEscape, active);
  return <button type="button">focus me</button>;
}

describe('useEscapeKey', () => {
  it('calls the handler on Escape', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Demo active onEscape={onEscape} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Escape}');
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler on other keys', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Demo active onEscape={onEscape} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Enter}');
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does not call the handler when inactive', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<Demo active={false} onEscape={onEscape} />);
    screen.getByRole('button').focus();
    await user.keyboard('{Escape}');
    expect(onEscape).not.toHaveBeenCalled();
  });
});
