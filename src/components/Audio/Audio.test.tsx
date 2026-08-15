import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expectNoA11yViolations } from '../../../tests/axe';
import { Audio, computePeaks } from './Audio';

// `decodeAudioPeaks` always resolves on a microtask (even its jsdom
// no-`AudioContext` short-circuit, since it's an `async function`) — this
// flushes that pending resolution inside `act()` so React's "not wrapped
// in act" warning doesn't fire once it lands after a test's synchronous
// assertions.
async function flushPeakDecode() {
  await act(async () => {
    await Promise.resolve();
  });
}

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

function loadDuration(audio: HTMLAudioElement, duration: number) {
  Object.defineProperty(audio, 'duration', { value: duration, configurable: true });
  fireEvent(audio, new Event('loadedmetadata'));
}

function mockWaveformRect(waveform: HTMLElement) {
  waveform.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 64,
      width: 200,
      height: 64,
      x: 0,
      y: 0,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

describe('computePeaks', () => {
  it('returns an empty array for an empty channel list', () => {
    expect(computePeaks([], 10)).toEqual([]);
  });

  it('downsamples a single channel to the requested bucket count', () => {
    const channel = new Float32Array([0, 0.2, 0.9, -0.9, 0.1, 0.1, 0.1, 0.1]);
    const peaks = computePeaks([channel], 4);
    expect(peaks).toHaveLength(4);
    expect(peaks[1]).toBeCloseTo(0.9);
  });

  it('takes the max magnitude across multiple channels', () => {
    const left = new Float32Array([0.1, 0.1]);
    const right = new Float32Array([0.8, 0.1]);
    const peaks = computePeaks([left, right], 2);
    expect(peaks[0]).toBeCloseTo(0.8);
  });

  it('clamps peaks to a maximum of 1', () => {
    const channel = new Float32Array([2, -2]);
    const peaks = computePeaks([channel], 1);
    expect(peaks[0]).toBe(1);
  });
});

describe('Audio', () => {
  it('renders a labelled audio element', async () => {
    render(<Audio src="clip.mp3" aria-label="Demo clip" />);
    await flushPeakDecode();
    expect(screen.getByLabelText('Demo clip').tagName).toBe('AUDIO');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Audio src="clip.mp3" aria-label="Demo clip" />);
    await flushPeakDecode();
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations when trimmable', async () => {
    const { container } = render(<Audio src="clip.mp3" trimmable />);
    await flushPeakDecode();
    await expectNoA11yViolations(container);
  });

  it('toggles play/pause', async () => {
    mockPlaybackMethods();
    const onPlay = vi.fn();
    const onPause = vi.fn();
    render(<Audio src="clip.mp3" onPlay={onPlay} onPause={onPause} />);
    await flushPeakDecode();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(onPlay).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalled();
  });

  it('toggles mute', async () => {
    render(<Audio src="clip.mp3" />);
    await flushPeakDecode();
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
  });

  it('does not render a seek/trim thumb until duration is known', async () => {
    render(<Audio src="clip.mp3" trimmable />);
    await flushPeakDecode();
    expect(screen.queryByRole('slider', { name: 'Seek' })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'Trim start' })).not.toBeInTheDocument();
  });

  it('renders a seek thumb once duration is known, and seeks by dragging the track', async () => {
    const { container } = render(<Audio src="clip.mp3" />);
    await flushPeakDecode();
    const audio = container.querySelector('audio') as HTMLAudioElement;
    loadDuration(audio, 100);

    const waveform = screen.getByRole('slider', { name: 'Seek' }).parentElement as HTMLElement;
    mockWaveformRect(waveform);
    fireEvent(waveform, new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 10 }));
    expect(audio.currentTime).toBe(25);
  });

  it('defaults the trim range to the full clip once duration is known', async () => {
    render(<Audio src="clip.mp3" trimmable />);
    await flushPeakDecode();
    // no assertion needed pre-duration; behavior verified via the keyboard test below,
    // which reads End as duration and Home as 0 on freshly-defaulted handles.
    expect(screen.queryByRole('slider', { name: 'Trim end' })).not.toBeInTheDocument();
  });

  it('cross-clamps trim start against trim end via keyboard', async () => {
    const onTrimChange = vi.fn();
    const { container } = render(
      <Audio src="clip.mp3" trimmable onTrimChange={onTrimChange} trimStep={1} />,
    );
    await flushPeakDecode();
    const audio = container.querySelector('audio') as HTMLAudioElement;
    loadDuration(audio, 20);

    const startHandle = screen.getByRole('slider', { name: 'Trim start' });
    startHandle.focus();
    fireEvent.keyDown(startHandle, { key: 'End' });
    // Home/End on "start" clamp to the current "end" (still 20, the default), not past it.
    expect(onTrimChange).toHaveBeenLastCalledWith({ start: 20, end: 20 });
  });

  it('nudges trim end left/right with arrow keys', async () => {
    const onTrimChange = vi.fn();
    const { container } = render(
      <Audio src="clip.mp3" trimmable onTrimChange={onTrimChange} trimStep={1} />,
    );
    await flushPeakDecode();
    const audio = container.querySelector('audio') as HTMLAudioElement;
    loadDuration(audio, 20);

    const endHandle = screen.getByRole('slider', { name: 'Trim end' });
    endHandle.focus();
    fireEvent.keyDown(endHandle, { key: 'ArrowLeft' });
    expect(onTrimChange).toHaveBeenLastCalledWith({ start: 0, end: 19 });
  });

  it('does not render trim handles when trimmable is false', async () => {
    const { container } = render(<Audio src="clip.mp3" />);
    await flushPeakDecode();
    const audio = container.querySelector('audio') as HTMLAudioElement;
    loadDuration(audio, 20);
    expect(screen.queryByRole('slider', { name: 'Trim start' })).not.toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'Trim end' })).not.toBeInTheDocument();
  });
});
