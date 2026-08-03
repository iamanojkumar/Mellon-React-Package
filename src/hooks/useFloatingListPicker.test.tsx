import { describe, expect, it, vi } from 'vitest';
import { forwardRef, useRef } from 'react';
import type { ForwardedRef } from 'react';
import { act, render } from '@testing-library/react';
import { useFloatingListPicker } from './useFloatingListPicker';
import type { FloatingListPickerHandle } from './useFloatingListPicker';

interface DemoItem {
  id: string;
  disabled?: boolean;
}

interface DemoProps {
  open: boolean;
  items: DemoItem[];
  onSelect: (item: DemoItem) => void;
  onClose: () => void;
}

const Demo = forwardRef(function Demo(
  { open, items, onSelect, onClose }: DemoProps,
  ref: ForwardedRef<FloatingListPickerHandle>,
) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { activeIndex } = useFloatingListPicker({
    open,
    anchorPoint: { x: 10, y: 20 },
    items,
    onSelect,
    onClose,
    panelRef,
    forwardedRef: ref,
  });
  return (
    <div ref={panelRef} data-testid="panel" data-active-index={activeIndex}>
      {items.map((item) => item.id).join(',')}
    </div>
  );
});

const ITEMS: DemoItem[] = [{ id: 'a' }, { id: 'b' }, { id: 'c', disabled: true }];

function makeEvent(key: string) {
  return { key, preventDefault: vi.fn() };
}

describe('useFloatingListPicker', () => {
  it('renders without throwing when open or closed', () => {
    expect(() =>
      render(<Demo open={false} items={ITEMS} onSelect={() => {}} onClose={() => {}} />),
    ).not.toThrow();
    expect(() =>
      render(<Demo open items={ITEMS} onSelect={() => {}} onClose={() => {}} />),
    ).not.toThrow();
  });

  it('handleKeyDown returns false and does nothing while closed', () => {
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    render(<Demo ref={handle} open={false} items={ITEMS} onSelect={() => {}} onClose={() => {}} />);
    const event = makeEvent('ArrowDown');
    expect(handle.current!.handleKeyDown(event)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('ArrowDown/ArrowUp move activeIndex, wrapping, and skip disabled items', () => {
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    const { getByTestId } = render(
      <Demo ref={handle} open items={ITEMS} onSelect={() => {}} onClose={() => {}} />,
    );
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '0');
    act(() => {
      handle.current!.handleKeyDown(makeEvent('ArrowDown'));
    });
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '1');
    // Wraps back to the first enabled item (0), skipping the disabled index 2.
    act(() => {
      handle.current!.handleKeyDown(makeEvent('ArrowDown'));
    });
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '0');
    act(() => {
      handle.current!.handleKeyDown(makeEvent('ArrowUp'));
    });
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '1');
  });

  it('Enter selects the active item and returns true', () => {
    const onSelect = vi.fn();
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    render(<Demo ref={handle} open items={ITEMS} onSelect={onSelect} onClose={() => {}} />);
    const event = makeEvent('Enter');
    expect(handle.current!.handleKeyDown(event)).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(ITEMS[0]);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('Escape calls onClose and returns true', () => {
    const onClose = vi.fn();
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    render(<Demo ref={handle} open items={ITEMS} onSelect={() => {}} onClose={onClose} />);
    expect(handle.current!.handleKeyDown(makeEvent('Escape'))).toBe(true);
    expect(onClose).toHaveBeenCalled();
  });

  it('an unhandled key returns false', () => {
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    render(<Demo ref={handle} open items={ITEMS} onSelect={() => {}} onClose={() => {}} />);
    expect(handle.current!.handleKeyDown(makeEvent('a'))).toBe(false);
  });

  it('resets activeIndex to 0 when items change', () => {
    const handle: { current: FloatingListPickerHandle | null } = { current: null };
    const { getByTestId, rerender } = render(
      <Demo ref={handle} open items={ITEMS} onSelect={() => {}} onClose={() => {}} />,
    );
    act(() => {
      handle.current!.handleKeyDown(makeEvent('ArrowDown'));
    });
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '1');
    rerender(
      <Demo ref={handle} open items={[{ id: 'z' }]} onSelect={() => {}} onClose={() => {}} />,
    );
    expect(getByTestId('panel')).toHaveAttribute('data-active-index', '0');
  });
});
