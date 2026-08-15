import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Video, formatTime } from './Video';

// jsdom's HTMLMediaElement.play() rejects with a "not implemented" error —
// every real player already needs a `.catch()` for autoplay-policy
// rejections, so this stub doubles as the jsdom compatibility shim rather
// than needing a separate mock.
function mockPlaybackMethods() {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function playStub(
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { value: false, configurable: true });
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function pauseStub(
    this: HTMLMediaElement,
  ) {
    Object.defineProperty(this, 'paused', { value: true, configurable: true });
    this.dispatchEvent(new Event('pause'));
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

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats hours as h:mm:ss once past an hour', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('falls back to 0:00 for non-finite or negative input', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });
});

describe('Video', () => {
  it('renders a labelled video element', () => {
    render(<Video src="clip.mp4" aria-label="Demo clip" />);
    expect(screen.getByLabelText('Demo clip').tagName).toBe('VIDEO');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Video src="clip.mp4" aria-label="Demo clip" />);
    await expectNoA11yViolations(container);
  });

  it('shows a big play button when paused, hides it once playing', () => {
    mockPlaybackMethods();
    render(<Video src="clip.mp4" />);
    expect(screen.getAllByRole('button', { name: 'Play' })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole('button', { name: 'Play' })[0]!);
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('toggles play/pause from the control bar button', () => {
    mockPlaybackMethods();
    const onPlay = vi.fn();
    const onPause = vi.fn();
    render(<Video src="clip.mp4" onPlay={onPlay} onPause={onPause} />);
    const playButton = screen.getAllByRole('button', { name: 'Play' })[0]!;
    fireEvent.click(playButton);
    expect(onPlay).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalled();
  });

  it('starts muted when autoPlay is set, regardless of defaultMuted', () => {
    render(<Video src="clip.mp4" autoPlay defaultMuted={false} />);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
  });

  it('toggles mute from the mute button', () => {
    render(<Video src="clip.mp4" />);
    const muteButton = screen.getByRole('button', { name: 'Mute' });
    fireEvent.click(muteButton);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
  });

  it('seeks by dragging the seek slider once duration is known', () => {
    const { container } = render(<Video src="clip.mp4" />);
    const video = container.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { value: 100, configurable: true });
    fireEvent(video, new Event('loadedmetadata'));

    const seekSlider = screen.getByRole('slider', { name: 'Seek' });
    const track = seekSlider.parentElement as HTMLElement;
    mockTrackRect(track);
    fireEvent(track, new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 10 }));
    expect(video.currentTime).toBe(25);
  });

  it('does not render a captions toggle when no captions are supplied', () => {
    render(<Video src="clip.mp4" />);
    expect(screen.queryByRole('button', { name: 'Show captions' })).not.toBeInTheDocument();
  });

  it('renders a captions toggle when caption tracks are supplied', () => {
    render(
      <Video src="clip.mp4" captions={[{ src: 'en.vtt', srcLang: 'en', label: 'English' }]} />,
    );
    expect(screen.getByRole('button', { name: 'Show captions' })).toBeInTheDocument();
  });

  it('toggles the fullscreen button label (requestFullscreen is feature-detected, unavailable in jsdom)', () => {
    render(<Video src="clip.mp4" />);
    expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument();
  });
});
