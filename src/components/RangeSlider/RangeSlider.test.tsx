import { describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { RangeSlider } from './RangeSlider';
import type { RangeSliderValue } from './RangeSlider';

// `showValue="drag"` (added alongside these tests) means each thumb now
// has an `onFocus` handler, so a real `.focus()` call — needed to make
// `document.activeElement` actually change for `user.keyboard(...)` to
// target it, unlike `fireEvent.focus()` — triggers a state update that
// must be `act()`-wrapped.
function focusThumb(element: HTMLElement) {
  act(() => {
    element.focus();
  });
}

function mockTrackRect(track: HTMLElement) {
  track.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 20,
      width: 200,
      height: 20,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

describe('RangeSlider', () => {
  it('renders two role=slider thumbs', () => {
    render(<RangeSlider />);
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RangeSlider defaultValue={[20, 80]} />);
    await expectNoA11yViolations(container);
  });

  it('defaults to [0, 100] and labels the thumbs Minimum/Maximum', () => {
    render(<RangeSlider />);
    const start = screen.getByRole('slider', { name: 'Minimum' });
    const end = screen.getByRole('slider', { name: 'Maximum' });
    expect(start).toHaveAttribute('aria-valuenow', '0');
    expect(end).toHaveAttribute('aria-valuenow', '100');
  });

  it('supports custom thumb labels', () => {
    render(<RangeSlider startLabel="Low" endLabel="High" />);
    expect(screen.getByRole('slider', { name: 'Low' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'High' })).toBeInTheDocument();
  });

  it('moves the start thumb with arrow keys, clamped to not pass the end thumb', async () => {
    const user = userEvent.setup();
    render(<RangeSlider defaultValue={[20, 25]} step={1} />);
    const start = screen.getByRole('slider', { name: 'Minimum' });
    focusThumb(start);
    await user.keyboard('{ArrowRight}');
    expect(start).toHaveAttribute('aria-valuenow', '21');
    // Push past the end thumb (25) — should clamp at 25, not exceed it.
    for (let i = 0; i < 10; i++) {
      await user.keyboard('{ArrowRight}');
    }
    expect(start).toHaveAttribute('aria-valuenow', '25');
  });

  it('moves the end thumb with arrow keys, clamped to not pass the start thumb', async () => {
    const user = userEvent.setup();
    render(<RangeSlider defaultValue={[70, 75]} step={1} />);
    const end = screen.getByRole('slider', { name: 'Maximum' });
    focusThumb(end);
    await user.keyboard('{ArrowLeft}');
    expect(end).toHaveAttribute('aria-valuenow', '74');
    for (let i = 0; i < 10; i++) {
      await user.keyboard('{ArrowLeft}');
    }
    expect(end).toHaveAttribute('aria-valuenow', '70');
  });

  it('jumps a thumb to min/max on Home/End, clamped against the other thumb', async () => {
    const user = userEvent.setup();
    render(<RangeSlider defaultValue={[20, 80]} min={0} max={100} />);
    const start = screen.getByRole('slider', { name: 'Minimum' });
    focusThumb(start);
    await user.keyboard('{End}');
    expect(start).toHaveAttribute('aria-valuenow', '80');
    await user.keyboard('{Home}');
    expect(start).toHaveAttribute('aria-valuenow', '0');
  });

  it('calls onChange with the full [start, end] tuple', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RangeSlider defaultValue={[20, 80]} onChange={onChange} />);
    focusThumb(screen.getByRole('slider', { name: 'Minimum' }));
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith([21, 80]);
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState<RangeSliderValue>([10, 90]);
      return <RangeSlider value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const start = screen.getByRole('slider', { name: 'Minimum' });
    expect(start).toHaveAttribute('aria-valuenow', '10');
    focusThumb(start);
    await user.keyboard('{ArrowRight}');
    expect(start).toHaveAttribute('aria-valuenow', '11');
  });

  it('is not focusable when disabled', () => {
    render(<RangeSlider disabled />);
    for (const slider of screen.getAllByRole('slider')) {
      expect(slider).toHaveAttribute('tabindex', '-1');
    }
  });

  it('picks the nearest thumb on a track click', () => {
    const onChange = vi.fn();
    render(<RangeSlider defaultValue={[20, 80]} min={0} max={100} onChange={onChange} />);
    const track = screen.getByRole('slider', { name: 'Minimum' }).parentElement as HTMLElement;
    mockTrackRect(track);
    // Click near the left edge (~10) — closer to the start thumb (20) than the end thumb (80).
    fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 10 }));
    expect(onChange).toHaveBeenCalledWith([10, 80]);
  });

  describe('showValue', () => {
    it('never shows value bubbles by default (showValue="off")', () => {
      render(<RangeSlider defaultValue={[20, 80]} />);
      expect(screen.queryByText('20')).not.toBeInTheDocument();
      expect(screen.queryByText('80')).not.toBeInTheDocument();
    });

    it('always shows both bubbles when showValue="always"', () => {
      render(<RangeSlider defaultValue={[20, 80]} showValue="always" />);
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('80')).toBeInTheDocument();
    });

    it('shows only the focused thumb\'s bubble when showValue="drag"', () => {
      render(<RangeSlider defaultValue={[20, 80]} showValue="drag" />);
      const start = screen.getByRole('slider', { name: 'Minimum' });
      focusThumb(start);
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.queryByText('80')).not.toBeInTheDocument();
      act(() => {
        start.blur();
      });
      expect(screen.queryByText('20')).not.toBeInTheDocument();
    });

    it("shows only the dragged thumb's bubble, not the other one", () => {
      render(<RangeSlider defaultValue={[20, 80]} min={0} max={100} showValue="drag" />);
      const track = screen.getByRole('slider', { name: 'Minimum' }).parentElement as HTMLElement;
      mockTrackRect(track);
      // Near the left edge — closer to the start (20) thumb than the end (80) thumb.
      fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 10 }));
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByText('80')).not.toBeInTheDocument();
    });
  });
});
