import { Children, Fragment, isValidElement } from 'react';
import type { ReactNode } from 'react';

/**
 * Recursively expands `ReactNode` children into a flat list of elements.
 *
 * Neither `Children.map` nor `Children.toArray` unwraps a literal
 * `<>...</>`/`<Fragment>` element — both treat it as a single opaque
 * child, so `cloneElement`ing or tabIndex-injecting over `Children.toArray`
 * directly silently targets the fragment wrapper instead of the elements
 * inside it (props set that way don't reach the fragment's children).
 * Consumers that accept a list of items through a non-`children` prop
 * (e.g. `ContextMenu`'s `menu`) are commonly authored as a JSX fragment,
 * so this must be handled, not just nested arrays (which the built-ins
 * already flatten fine on their own).
 */
export function flattenChildren(children: ReactNode): ReactNode[] {
  const result: ReactNode[] = [];
  Children.toArray(children).forEach((child) => {
    if (isValidElement(child) && child.type === Fragment) {
      result.push(...flattenChildren((child.props as { children?: ReactNode }).children));
    } else {
      result.push(child);
    }
  });
  return result;
}
