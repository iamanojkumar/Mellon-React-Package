import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useControllableState } from './useControllableState';

describe('useControllableState', () => {
  it('tracks its own state when uncontrolled', () => {
    const { result } = renderHook(() => useControllableState({ defaultValue: 'a' }));
    expect(result.current[0]).toBe('a');

    act(() => {
      result.current[1]('b');
    });
    expect(result.current[0]).toBe('b');
  });

  it('defers to the value prop when controlled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, onChange: () => {} }),
      { initialProps: { value: 'a' } },
    );
    expect(result.current[0]).toBe('a');

    act(() => {
      result.current[1]('b');
    });
    // controlled: internal state never changes on its own
    expect(result.current[0]).toBe('a');

    rerender({ value: 'b' });
    expect(result.current[0]).toBe('b');
  });

  it('calls onChange in both controlled and uncontrolled modes', () => {
    const calls: string[] = [];
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 'a', onChange: (v: string) => calls.push(v) }),
    );

    act(() => {
      result.current[1]('b');
    });
    expect(calls).toEqual(['b']);
  });
});
