import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { SegmentTrack } from './SegmentTrack';
import type { SegmentTrackSegment } from './SegmentTrack';

const segments: SegmentTrackSegment[] = [
  { id: 'c1', start: 12.4, end: 15.1, state: 'candidate', confidence: 0.82 },
  { id: 'c2', start: 40.0, end: 44.6, state: 'excluded' },
  { id: 'c3', start: 60.2, end: 63.9, state: 'selected' },
  { id: 'c4', start: 90.0, end: 92.5, state: 'accepted' },
  { id: 'c5', start: 110.1, end: 113.0, state: 'rejected' },
];

function mockTrackRect(track: HTMLElement) {
  track.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 56,
      width: 200,
      height: 56,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

describe('SegmentTrack', () => {
  it('renders one option per segment', () => {
    render(<SegmentTrack duration={200} segments={segments} />);
    expect(screen.getAllByRole('option')).toHaveLength(5);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SegmentTrack
        duration={200}
        currentTime={30}
        waveform={[0.2, 0.6, 0.4]}
        segments={segments}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('labels each option with its state and time range', () => {
    render(<SegmentTrack duration={200} segments={segments} />);
    expect(
      screen.getByRole('option', { name: /Candidate segment, 0:12–0:15, 82% confidence/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Accepted segment, 1:30–1:32/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Rejected segment, 1:50–1:53/ })).toBeInTheDocument();
  });

  it('fires onSegmentClick when a segment is clicked', () => {
    const onSegmentClick = vi.fn();
    render(<SegmentTrack duration={200} segments={segments} onSegmentClick={onSegmentClick} />);
    fireEvent.click(screen.getByRole('option', { name: /Selected segment/ }));
    expect(onSegmentClick).toHaveBeenCalledWith('c3');
  });

  it('does not fire onSeek when a segment is clicked', () => {
    const onSeek = vi.fn();
    const onSegmentClick = vi.fn();
    const { container } = render(
      <SegmentTrack
        duration={200}
        segments={segments}
        onSegmentClick={onSegmentClick}
        onSeek={onSeek}
      />,
    );
    const track = container.querySelector('[role="listbox"]') as HTMLElement;
    mockTrackRect(track);
    const option = screen.getByRole('option', { name: /Selected segment/ });
    fireEvent(option, new MouseEvent('pointerdown', { bubbles: true, clientX: 60, clientY: 10 }));
    fireEvent.click(option);
    expect(onSegmentClick).toHaveBeenCalledWith('c3');
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('fires onSeek when the empty track is clicked', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <SegmentTrack duration={200} segments={segments} onSeek={onSeek} />,
    );
    const track = container.querySelector('[role="listbox"]') as HTMLElement;
    mockTrackRect(track);
    fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 10 }));
    expect(onSeek).toHaveBeenCalledWith(100);
  });

  it('moves selection to the next segment (left-to-right by start) on ArrowRight', () => {
    const onSegmentClick = vi.fn();
    render(
      <SegmentTrack
        duration={200}
        segments={segments}
        selectedId="c1"
        onSegmentClick={onSegmentClick}
      />,
    );
    const first = screen.getByRole('option', { name: /Candidate segment/ });
    act(() => first.focus());
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(onSegmentClick).toHaveBeenCalledWith('c2');
  });

  it('moves selection to the previous segment on ArrowLeft', () => {
    const onSegmentClick = vi.fn();
    render(
      <SegmentTrack
        duration={200}
        segments={segments}
        selectedId="c3"
        onSegmentClick={onSegmentClick}
      />,
    );
    const third = screen.getByRole('option', { name: /Selected segment/ });
    act(() => third.focus());
    fireEvent.keyDown(third, { key: 'ArrowLeft' });
    expect(onSegmentClick).toHaveBeenCalledWith('c2');
  });

  it('marks the selected segment via aria-selected', () => {
    render(<SegmentTrack duration={200} segments={segments} selectedId="c4" />);
    expect(screen.getByRole('option', { name: /Accepted segment/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: /Candidate segment/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('renders no segments when duration is not yet known', () => {
    render(<SegmentTrack duration={0} segments={segments} />);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
