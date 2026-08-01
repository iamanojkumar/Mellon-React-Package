import { describe, expect, it } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from './useFocusTrap';

function TrapDemo({ active }: { active: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, { active });
  return (
    <div ref={containerRef} data-testid="trap">
      <button type="button">first</button>
      <button type="button">second</button>
      <button type="button">last</button>
    </div>
  );
}

function ToggleableTrap() {
  const [active, setActive] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setActive((a) => !a)} data-testid="trigger">
        trigger
      </button>
      <TrapDemo active={active} />
      <button type="button">outside after</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('focuses the first focusable element on activate', () => {
    render(<TrapDemo active />);
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('cycles focus from the last element back to the first on Tab', async () => {
    const user = userEvent.setup();
    render(<TrapDemo active />);
    screen.getByRole('button', { name: 'last' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('cycles focus from the first element to the last on Shift+Tab', async () => {
    const user = userEvent.setup();
    render(<TrapDemo active />);
    screen.getByRole('button', { name: 'first' }).focus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus();
  });

  it('pulls focus back in if something outside the trap is focused', async () => {
    const user = userEvent.setup();
    render(<ToggleableTrap />);
    await user.click(screen.getByRole('button', { name: 'trigger' }));
    screen.getByRole('button', { name: 'outside after' }).focus();
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();
  });

  it('restores focus to the element that triggered activation, once deactivated', async () => {
    const user = userEvent.setup();
    render(<ToggleableTrap />);
    const trigger = screen.getByTestId('trigger');

    await user.click(trigger); // activates: captures trigger as "previously focused", moves focus into the trap
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus();

    await user.click(trigger); // deactivates: cleanup restores focus to trigger
    expect(trigger).toHaveFocus();
  });

  it('does nothing when inactive', () => {
    render(<TrapDemo active={false} />);
    expect(document.body).toHaveFocus();
  });
});
