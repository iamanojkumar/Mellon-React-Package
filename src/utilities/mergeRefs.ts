import type { MutableRefObject, Ref, RefCallback } from 'react';

/** Combines multiple refs (e.g. a forwarded ref + an internally-needed one) onto one element. */
export function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return (instance) => {
    for (const ref of refs) {
      if (ref == null) continue;
      if (typeof ref === 'function') {
        ref(instance);
      } else {
        (ref as MutableRefObject<T | null>).current = instance;
      }
    }
  };
}
