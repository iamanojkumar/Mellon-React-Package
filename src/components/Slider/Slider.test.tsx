import { describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Slider, clamp, roundToStep } from './Slider';

// `showValue="drag"` (added alongside these tests) means the thumb now has
// an `onFocus` handler, so a real `.focus()` call — needed here to make
// `document.activeElement` actually change for `user.keyboard(...)` to
// target it, unlike `fireEvent.focus()` — triggers a state update that
// must be `act()`-wrapped.
function focusSlider(element: HTMLElement) {
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

describe('clamp/roundToStep', () => {
  it('clamps within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('rounds to the nearest step from min', () => {
    expect(roundToStep(23, 0, 10)).toBe(20);
    expect(roundToStep(27, 0, 10)).toBe(30);
    expect(roundToStep(24, 5, 10)).toBe(25);
  });
});

describe('Slider', () => {
  it('renders a role=slider element', () => {
    render(<Slider aria-label="Volume" />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Slider aria-label="Volume" defaultValue={40} />);
    await expectNoA11yViolations(container);
  });

  it('defaults min/max/value to 0/100/0', () => {
    render(<Slider aria-label="Volume" />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('reflects defaultValue', () => {
    render(<Slider aria-label="Volume" defaultValue={35} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '35');
  });

  it('increases by step on ArrowRight/ArrowUp, decreases on ArrowLeft/ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={50} step={5} />);
    const slider = screen.getByRole('slider');
    focusSlider(slider);
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '60');
    await user.keyboard('{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuenow', '55');
    await user.keyboard('{ArrowDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('jumps a bigger step on PageUp/PageDown', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={50} step={2} />);
    const slider = screen.getByRole('slider');
    focusSlider(slider);
    await user.keyboard('{PageUp}');
    expect(slider).toHaveAttribute('aria-valuenow', '70');
    await user.keyboard('{PageDown}');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('jumps to min/max on Home/End', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={50} min={10} max={90} />);
    const slider = screen.getByRole('slider');
    focusSlider(slider);
    await user.keyboard('{End}');
    expect(slider).toHaveAttribute('aria-valuenow', '90');
    await user.keyboard('{Home}');
    expect(slider).toHaveAttribute('aria-valuenow', '10');
  });

  it('clamps at min/max and does not go out of bounds', async () => {
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={98} max={100} step={5} />);
    const slider = screen.getByRole('slider');
    focusSlider(slider);
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '100');
  });

  it('calls onChange with the new value', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Slider aria-label="Volume" defaultValue={50} onChange={onChange} />);
    focusSlider(screen.getByRole('slider'));
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(51);
  });

  it('works controlled, deferring to the value prop', async () => {
    function Controlled() {
      const [value, setValue] = useState(20);
      return <Slider aria-label="Volume" value={value} onChange={setValue} />;
    }
    const user = userEvent.setup();
    render(<Controlled />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '20');
    focusSlider(slider);
    await user.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '21');
  });

  it('sets aria-valuetext from formatValue', () => {
    render(<Slider aria-label="Volume" defaultValue={5} formatValue={(v) => `${v} of 10`} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '5 of 10');
  });

  describe('showValue', () => {
    it('never shows a value bubble by default (showValue="off")', () => {
      render(<Slider aria-label="Volume" defaultValue={50} />);
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });

    it('always shows the value bubble when showValue="always"', () => {
      render(<Slider aria-label="Volume" defaultValue={50} showValue="always" />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('formats the bubble text with formatValue', () => {
      render(
        <Slider
          aria-label="Volume"
          defaultValue={50}
          showValue="always"
          formatValue={(v) => `${v}%`}
        />,
      );
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows the bubble only while focused/dragging when showValue="drag"', () => {
      render(<Slider aria-label="Volume" defaultValue={50} showValue="drag" />);
      const slider = screen.getByRole('slider');
      expect(screen.queryByText('50')).not.toBeInTheDocument();
      focusSlider(slider);
      expect(screen.getByText('50')).toBeInTheDocument();
      act(() => {
        slider.blur();
      });
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });

    it('shows the bubble while dragging when showValue="drag"', () => {
      render(<Slider aria-label="Volume" min={0} max={100} showValue="drag" />);
      const track = screen.getByRole('slider').parentElement as HTMLElement;
      mockTrackRect(track); // 200px wide — clientX:100 is the midpoint (value 50)
      fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 10 }));
      expect(screen.getByText('50')).toBeInTheDocument();
      fireEvent(track, new MouseEvent('pointerup', { bubbles: true, clientX: 100, clientY: 10 }));
      expect(screen.queryByText('50')).not.toBeInTheDocument();
    });
  });

  it('is not focusable when disabled', () => {
    render(<Slider aria-label="Volume" disabled />);
    expect(screen.getByRole('slider')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true');
  });

  it('ignores keyboard input when disabled', async () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" defaultValue={50} disabled onChange={onChange} />);
    const slider = screen.getByRole('slider');
    focusSlider(slider);
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('jumps to the clicked position on the track', () => {
    const onChange = vi.fn();
    render(<Slider aria-label="Volume" min={0} max={100} onChange={onChange} />);
    const track = screen.getByRole('slider').parentElement as HTMLElement;
    mockTrackRect(track);
    // jsdom has no PointerEvent constructor — a plain MouseEvent stands in,
    // same as usePointerDrag's own tests (see that file's comment); it has
    // real clientX/clientY, which is all Slider reads off the event.
    // `fireEvent`, not a raw `dispatchEvent`, so the resulting state update
    // is wrapped in `act(...)`.
    fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 10 }));
    expect(onChange).toHaveBeenCalledWith(50);
  });
});
