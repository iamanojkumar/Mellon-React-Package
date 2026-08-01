import { describe, expect, it, vi } from 'vitest';
import { useRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useClickOutside } from './useClickOutside';

function Demo({ active, onOutside }: { active: boolean; onOutside: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onOutside, active);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <button type="button">outside</button>
    </div>
  );
}

function MultiRefDemo({ onOutside }: { onOutside: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const excludedRef = useRef<HTMLButtonElement>(null);
  useClickOutside([panelRef, excludedRef], onOutside, true);
  return (
    <div>
      <div ref={panelRef} data-testid="panel">
        panel
      </div>
      <button ref={excludedRef} type="button">
        excluded
      </button>
      <button type="button">outside</button>
    </div>
  );
}

describe('useClickOutside', () => {
  it('calls the handler on a pointerdown outside the element', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    render(<Demo active onOutside={onOutside} />);
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler on a pointerdown inside the element', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    render(<Demo active onOutside={onOutside} />);
    await user.click(screen.getByTestId('inside'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('does not call the handler when inactive', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    render(<Demo active={false} onOutside={onOutside} />);
    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('accepts an array of refs, excluding clicks inside any of them', async () => {
    const user = userEvent.setup();
    const onOutside = vi.fn();
    render(<MultiRefDemo onOutside={onOutside} />);

    await user.click(screen.getByTestId('panel'));
    expect(onOutside).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'excluded' }));
    expect(onOutside).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'outside' }));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});
