import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { Placement, VirtualElement } from '@floating-ui/dom';

export interface UsePositioningOptions {
  active: boolean;
  placement?: Placement;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Either a ref to a real trigger element (the usual case) or a floating-ui
 * `VirtualElement` — just a `getBoundingClientRect()` — for positioning
 * relative to an arbitrary point instead of an element, e.g. a future
 * Context Menu opening at the click coordinates rather than a trigger.
 */
export type PositioningReference = RefObject<Element | null> | VirtualElement;

function isVirtualElement(reference: PositioningReference): reference is VirtualElement {
  return 'getBoundingClientRect' in reference;
}

/**
 * Thin wrapper around @floating-ui/dom: positions `floatingRef` relative to
 * `reference`, flipping to the opposite side or shifting along the axis
 * when it would overflow the viewport, and recomputing on scroll/resize
 * via `autoUpdate` while `active`. Apply the returned `{ x, y }` as
 * `position: absolute; left: x; top: y` on the floating element.
 */
export function usePositioning(
  reference: PositioningReference,
  floatingRef: RefObject<HTMLElement | null>,
  { active, placement = 'bottom-start' }: UsePositioningOptions,
): Position {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) return;
    const referenceEl = isVirtualElement(reference) ? reference : reference.current;
    const floating = floatingRef.current;
    if (!referenceEl || !floating) return;

    const update = () => {
      void computePosition(referenceEl, floating, {
        placement,
        middleware: [offset(4), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setPosition({ x, y });
      });
    };

    return autoUpdate(referenceEl, floating, update);
  }, [active, reference, floatingRef, placement]);

  return position;
}
