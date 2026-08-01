import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { mergeRefs } from './mergeRefs';

describe('mergeRefs', () => {
  it('sets the value on a ref object', () => {
    const ref = createRef<string>();
    mergeRefs(ref)('value');
    expect(ref.current).toBe('value');
  });

  it('calls a callback ref', () => {
    let received: string | null = null;
    mergeRefs<string>((v) => {
      received = v;
    })('value');
    expect(received).toBe('value');
  });

  it('updates every ref passed, ignoring null/undefined entries', () => {
    const refA = createRef<string>();
    const refB = createRef<string>();
    let callbackValue: string | null = null;

    mergeRefs<string>(refA, null, undefined, refB, (v) => {
      callbackValue = v;
    })('value');

    expect(refA.current).toBe('value');
    expect(refB.current).toBe('value');
    expect(callbackValue).toBe('value');
  });
});
