import { describe, expect, it } from 'vitest';
import { useRef } from 'react';
import { render } from '@testing-library/react';
import { usePositioning } from './usePositioning';

// jsdom has no layout engine (getBoundingClientRect is always zeroed), so
// real positioning math can't be meaningfully asserted here — this checks
// the hook runs without error and returns a coordinate pair, same
// jsdom-vs-real-browser tradeoff as tests/axe.ts's color-contrast rule.
// Storybook's real-browser stories are the source of truth for placement.
function Demo({ active }: { active: boolean }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const position = usePositioning(triggerRef, floatingRef, { active });
  return (
    <div>
      <button type="button" ref={triggerRef}>
        trigger
      </button>
      <div ref={floatingRef} data-testid="floating" data-x={position.x} data-y={position.y}>
        floating
      </div>
    </div>
  );
}

describe('usePositioning', () => {
  it('renders without throwing when inactive', () => {
    expect(() => render(<Demo active={false} />)).not.toThrow();
  });

  it('renders without throwing when active, and unmounts cleanly', () => {
    const { unmount } = render(<Demo active />);
    expect(() => unmount()).not.toThrow();
  });
});
