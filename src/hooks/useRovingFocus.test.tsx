import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRovingFocus } from './useRovingFocus';
import type { RovingFocusOrientation } from './useRovingFocus';

function Demo({
  orientation,
  wrap,
  onNavigate,
}: {
  orientation: RovingFocusOrientation;
  wrap?: boolean;
  onNavigate?: (item: HTMLElement) => void;
}) {
  const handleKeyDown = useRovingFocus({
    itemSelector: '[data-item]:not([data-disabled])',
    orientation,
    wrap,
    onNavigate,
  });

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- test-only container; the keydown is a roving-tabindex delegation pattern (real consumers use role="tablist"/"menu", which jsx-a11y already treats as interactive)
    <div role="group" onKeyDown={handleKeyDown}>
      <button type="button" data-item tabIndex={0}>
        One
      </button>
      <button type="button" data-item tabIndex={-1}>
        Two
      </button>
      <button type="button" data-item data-disabled disabled tabIndex={-1}>
        Three (disabled)
      </button>
      <button type="button" data-item tabIndex={-1}>
        Four
      </button>
    </div>
  );
}

describe('useRovingFocus', () => {
  it('horizontal: ArrowRight/ArrowLeft move focus and wrap by default', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="horizontal" />);
    screen.getByRole('button', { name: 'One' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();

    // "Three" is disabled and excluded by the item selector, so ArrowRight skips to "Four"
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();

    // wraps back to "One"
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();
  });

  it('horizontal: ignores ArrowUp/ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="horizontal" />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('vertical: ArrowDown/ArrowUp move focus', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="vertical" />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('both: either axis moves focus forward/backward', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="both" />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('Home/End jump to the first/last non-excluded item', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="horizontal" />);
    screen.getByRole('button', { name: 'Two' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('does not wrap when wrap is false', async () => {
    const user = userEvent.setup();
    render(<Demo orientation="horizontal" wrap={false} />);
    screen.getByRole('button', { name: 'Four' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'Four' })).toHaveFocus();

    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('calls onNavigate with the newly-focused item (automatic activation)', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Demo orientation="horizontal" onNavigate={onNavigate} />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onNavigate).toHaveBeenCalledWith(screen.getByRole('button', { name: 'Two' }));
  });

  it('does not call onNavigate for keys it does not handle', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Demo orientation="horizontal" onNavigate={onNavigate} />);
    screen.getByRole('button', { name: 'One' }).focus();
    await user.keyboard('{Escape}');
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
