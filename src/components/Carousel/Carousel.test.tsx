import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Carousel } from './Carousel';

// jsdom has no PointerEvent constructor - see usePointerDrag.test.tsx's
// identical helper/comment, reused here for the swipe tests.
function pointerEvent(type: string, clientX: number, clientY: number) {
  return new MouseEvent(type, { clientX, clientY, bubbles: true, cancelable: true });
}

function BasicCarousel(props: {
  loop?: boolean;
  defaultIndex?: number;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onIndexChange?: (index: number) => void;
}) {
  return (
    <Carousel {...props}>
      <div>Slide One</div>
      <div>Slide Two</div>
      <div>Slide Three</div>
    </Carousel>
  );
}

function ControlledCarousel(props: { onIndexChange?: (index: number) => void }) {
  const [index, setIndex] = useState(0);
  return (
    <Carousel
      index={index}
      onIndexChange={(next) => {
        setIndex(next);
        props.onIndexChange?.(next);
      }}
    >
      <div>Slide One</div>
      <div>Slide Two</div>
      <div>Slide Three</div>
    </Carousel>
  );
}

describe('Carousel', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders a region labelled "Carousel" by default', () => {
    render(<BasicCarousel />);
    expect(screen.getByRole('region', { name: 'Carousel' })).toHaveAttribute(
      'aria-roledescription',
      'carousel',
    );
  });

  it('accepts a custom aria-label', () => {
    render(
      <Carousel aria-label="Featured products">
        <div>One</div>
      </Carousel>,
    );
    expect(screen.getByRole('region', { name: 'Featured products' })).toBeInTheDocument();
  });

  it('renders one labelled group per slide', () => {
    const { container } = render(<BasicCarousel />);
    // aria-hidden slides compute an empty accessible name, so role-based
    // queries with a `name` filter can't find them even with
    // `hidden: true` — query by the slide role attribute directly instead.
    const groups = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveAttribute('aria-label', '1 of 3');
  });

  it('hides every slide except the current one from assistive tech', () => {
    const { container } = render(<BasicCarousel />);
    const groups = container.querySelectorAll('[aria-roledescription="slide"]');
    expect(groups[0]).not.toHaveAttribute('aria-hidden');
    expect(groups[1]).toHaveAttribute('aria-hidden', 'true');
    expect(groups[2]).toHaveAttribute('aria-hidden', 'true');
  });

  it('navigates with the Next/Previous buttons and calls onIndexChange', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<ControlledCarousel onIndexChange={onIndexChange} />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('wraps from the last slide to the first when looping (default)', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<ControlledCarousel onIndexChange={onIndexChange} />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(0);
  });

  it('disables Previous/Next at the ends when loop is false', () => {
    render(<BasicCarousel loop={false} defaultIndex={0} />);
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next slide' })).not.toBeDisabled();
  });

  it('jumps to a slide via its indicator and marks it aria-current', async () => {
    const user = userEvent.setup();
    render(<BasicCarousel />);
    await user.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('navigates with ArrowRight/ArrowLeft', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    render(<ControlledCarousel onIndexChange={onIndexChange} />);
    // ArrowRight/Left bubble up from whatever's focused inside the region
    // (the region itself has no tabIndex, matching how the W3C APG
    // carousel example wires this) — focus a real descendant control.
    screen.getByRole('button', { name: 'Next slide' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('updates the live region text with the current slide position', async () => {
    const user = userEvent.setup();
    render(<ControlledCarousel />);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByText('Slide 2 of 3')).toBeInTheDocument();
  });

  it('shows no Play/Pause button when autoPlay is not set', () => {
    render(<BasicCarousel />);
    expect(screen.queryByRole('button', { name: /slideshow/ })).not.toBeInTheDocument();
  });

  it('shows a Pause button once autoPlay is set (and reduced-motion is not preferred)', () => {
    render(<BasicCarousel autoPlay />);
    expect(screen.getByRole('button', { name: 'Pause slideshow' })).toBeInTheDocument();
  });

  it('auto-advances on an interval while playing', () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    render(<BasicCarousel autoPlay autoPlayInterval={1000} onIndexChange={onIndexChange} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('stops auto-advancing once paused', () => {
    vi.useFakeTimers();
    const onIndexChange = vi.fn();
    render(<BasicCarousel autoPlay autoPlayInterval={1000} onIndexChange={onIndexChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause slideshow' }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('starts paused when the user prefers reduced motion, even with autoPlay set', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(<BasicCarousel autoPlay />);
    expect(screen.getByRole('button', { name: 'Play slideshow' })).toBeInTheDocument();
  });

  it('changes slide on a leftward swipe past the threshold', () => {
    const onIndexChange = vi.fn();
    render(<BasicCarousel onIndexChange={onIndexChange} />);
    const viewport = screen.getAllByRole('group')[0]!.closest('[class*="viewport"]')!;
    fireEvent(viewport, pointerEvent('pointerdown', 200, 100));
    fireEvent(viewport, pointerEvent('pointermove', 100, 100));
    fireEvent(viewport, pointerEvent('pointerup', 100, 100));
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('does not change slide on a swipe under the threshold', () => {
    const onIndexChange = vi.fn();
    render(<BasicCarousel onIndexChange={onIndexChange} />);
    const viewport = screen.getAllByRole('group')[0]!.closest('[class*="viewport"]')!;
    fireEvent(viewport, pointerEvent('pointerdown', 200, 100));
    fireEvent(viewport, pointerEvent('pointermove', 190, 100));
    fireEvent(viewport, pointerEvent('pointerup', 190, 100));
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<BasicCarousel autoPlay />);
    await expectNoA11yViolations(container);
  });
});
