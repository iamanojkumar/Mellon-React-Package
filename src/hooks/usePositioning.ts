import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { autoUpdate, computePosition, flip, offset, shift } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/dom';

export interface UsePositioningOptions {
  active: boolean;
  placement?: Placement;
}

export interface Position {
  x: number;
  y: number;
}

/**
 * Thin wrapper around @floating-ui/dom: positions `floatingRef` relative to
 * `triggerRef`, flipping to the opposite side or shifting along the axis
 * when it would overflow the viewport, and recomputing on scroll/resize
 * via `autoUpdate` while `active`. Apply the returned `{ x, y }` as
 * `position: absolute; left: x; top: y` on the floating element.
 */
export function usePositioning(
  triggerRef: RefObject<Element | null>,
  floatingRef: RefObject<HTMLElement | null>,
  { active, placement = 'bottom-start' }: UsePositioningOptions,
): Position {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!active) return;
    const trigger = triggerRef.current;
    const floating = floatingRef.current;
    if (!trigger || !floating) return;

    const update = () => {
      void computePosition(trigger, floating, {
        placement,
        middleware: [offset(4), flip(), shift({ padding: 8 })],
      }).then(({ x, y }) => {
        setPosition({ x, y });
      });
    };

    return autoUpdate(trigger, floating, update);
  }, [active, triggerRef, floatingRef, placement]);

  return position;
}
