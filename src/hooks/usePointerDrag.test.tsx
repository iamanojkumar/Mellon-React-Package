import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { usePointerDrag } from './usePointerDrag';
import type { PointerDragDelta } from './usePointerDrag';

// jsdom has no PointerEvent constructor (see usePointerDrag.ts's doc
// comment on the setPointerCapture feature-detection this works around),
// so a plain MouseEvent stands in here — it has real clientX/clientY,
// which is all this hook reads off the event besides pointerId (which is
// only ever read inside the now-skipped setPointerCapture/
// releasePointerCapture branches, so it doesn't need to be faked).
function pointerEvent(type: string, clientX: number, clientY: number) {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });
}

function Demo({
  disabled,
  onDragMove,
}: {
  disabled?: boolean;
  onDragMove?: (delta: PointerDragDelta) => void;
}) {
  const { isDragging, handlers } = usePointerDrag({
    disabled,
    onDragMove: (_event, delta) => onDragMove?.(delta),
  });
  return (
    <div data-testid="handle" data-dragging={isDragging} {...handlers}>
      handle
    </div>
  );
}

describe('usePointerDrag', () => {
  it('is not dragging before any pointer interaction', () => {
    render(<Demo />);
    expect(screen.getByTestId('handle')).toHaveAttribute('data-dragging', 'false');
  });

  it('enters the dragging state on pointerdown and calls onDragStart', () => {
    const onDragStart = vi.fn();
    function DemoWithStart() {
      const { isDragging, handlers } = usePointerDrag({ onDragStart });
      return (
        <div data-testid="handle" data-dragging={isDragging} {...handlers}>
          handle
        </div>
      );
    }
    render(<DemoWithStart />);
    fireEvent(screen.getByTestId('handle'), pointerEvent('pointerdown', 0, 0));
    expect(screen.getByTestId('handle')).toHaveAttribute('data-dragging', 'true');
    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('reports the cumulative delta from the drag origin on pointermove', () => {
    const onDragMove = vi.fn();
    render(<Demo onDragMove={onDragMove} />);
    const handle = screen.getByTestId('handle');
    fireEvent(handle, pointerEvent('pointerdown', 100, 200));
    fireEvent(handle, pointerEvent('pointermove', 130, 190));
    expect(onDragMove).toHaveBeenCalledWith({ x: 30, y: -10 });
    fireEvent(handle, pointerEvent('pointermove', 150, 220));
    expect(onDragMove).toHaveBeenLastCalledWith({ x: 50, y: 20 });
  });

  it('ignores pointermove before a pointerdown', () => {
    const onDragMove = vi.fn();
    render(<Demo onDragMove={onDragMove} />);
    fireEvent(screen.getByTestId('handle'), pointerEvent('pointermove', 10, 10));
    expect(onDragMove).not.toHaveBeenCalled();
  });

  it('ends the drag and calls onDragEnd on pointerup', () => {
    const onDragEnd = vi.fn();
    function DemoWithEnd() {
      const { isDragging, handlers } = usePointerDrag({ onDragEnd });
      return (
        <div data-testid="handle" data-dragging={isDragging} {...handlers}>
          handle
        </div>
      );
    }
    render(<DemoWithEnd />);
    const handle = screen.getByTestId('handle');
    fireEvent(handle, pointerEvent('pointerdown', 0, 0));
    expect(handle).toHaveAttribute('data-dragging', 'true');
    fireEvent(handle, pointerEvent('pointerup', 5, 5));
    expect(handle).toHaveAttribute('data-dragging', 'false');
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  it('ends the drag on pointercancel same as pointerup', () => {
    render(<Demo />);
    const handle = screen.getByTestId('handle');
    fireEvent(handle, pointerEvent('pointerdown', 0, 0));
    expect(handle).toHaveAttribute('data-dragging', 'true');
    fireEvent(handle, pointerEvent('pointercancel', 0, 0));
    expect(handle).toHaveAttribute('data-dragging', 'false');
  });

  it('does not start a drag when disabled', () => {
    render(<Demo disabled />);
    const handle = screen.getByTestId('handle');
    fireEvent(handle, pointerEvent('pointerdown', 0, 0));
    expect(handle).toHaveAttribute('data-dragging', 'false');
  });
});
