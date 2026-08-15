import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { SegmentTrack } from './SegmentTrack';
import type { SegmentTrackSegment } from './SegmentTrack';
import { Stack } from '../Stack/Stack';
import { Inline } from '../Inline/Inline';
import { Text } from '../Text/Text';

const DURATION = 180;

const SEGMENTS: SegmentTrackSegment[] = [
  { id: 'c1', start: 12.4, end: 15.1, state: 'candidate', confidence: 0.82 },
  { id: 'c2', start: 40.0, end: 44.6, state: 'excluded' },
  { id: 'c3', start: 60.2, end: 63.9, state: 'selected' },
  { id: 'c4', start: 90.0, end: 92.5, state: 'accepted' },
  { id: 'c5', start: 110.1, end: 113.0, state: 'rejected' },
  { id: 'c6', start: 140.0, end: 142.8, state: 'candidate', confidence: 0.64 },
];

const WAVEFORM = Array.from({ length: 96 }, (_, i) => 0.15 + Math.abs(Math.sin(i / 4)) * 0.6);

const meta: Meta<typeof SegmentTrack> = {
  title: 'Media/SegmentTrack',
  component: SegmentTrack,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SegmentTrack>;

export const Default: Story = {
  args: {
    duration: DURATION,
    currentTime: 62,
    segments: SEGMENTS,
    selectedId: 'c3',
    'aria-label': 'Detected same-speaker segments',
  },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <SegmentTrack {...args} />
    </div>
  ),
};

export const WithWaveform: Story = {
  args: {
    ...Default.args,
    waveform: WAVEFORM,
  },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <SegmentTrack {...args} />
    </div>
  ),
};

/**
 * The full review-queue shape: clicking a segment (or arrowing to it) both
 * selects it and reports which id to load into the review panel below —
 * seeking the actual media element is the app's job, same as the request
 * that scoped this component describes.
 */
export const ReviewQueue: Story = {
  render: () => {
    function ReviewQueueDemo() {
      const [segments, setSegments] = useState(SEGMENTS);
      const [selectedId, setSelectedId] = useState('c3');

      const selected = segments.find((segment) => segment.id === selectedId);

      function selectSegment(id: string) {
        setSelectedId(id);
        setSegments((current) =>
          current.map((segment) =>
            segment.id === id
              ? { ...segment, state: 'selected' }
              : segment.state === 'selected'
                ? { ...segment, state: 'candidate' }
                : segment,
          ),
        );
      }

      function decide(state: 'accepted' | 'rejected') {
        if (!selectedId) return;
        setSegments((current) =>
          current.map((segment) => (segment.id === selectedId ? { ...segment, state } : segment)),
        );
      }

      return (
        <Stack gap="lg" style={{ maxWidth: 640 }}>
          <SegmentTrack
            duration={DURATION}
            segments={segments}
            selectedId={selectedId}
            onSegmentClick={selectSegment}
            onSeek={() => {}}
            aria-label="Detected same-speaker segments"
          />
          <Text>
            {selected
              ? `Reviewing ${selected.id}: ${selected.start.toFixed(1)}s–${selected.end.toFixed(1)}s (${selected.state})`
              : 'No segment selected'}
          </Text>
          <Inline gap="sm">
            <button type="button" onClick={() => decide('accepted')}>
              Accept
            </button>
            <button type="button" onClick={() => decide('rejected')}>
              Reject
            </button>
          </Inline>
        </Stack>
      );
    }
    return <ReviewQueueDemo />;
  },
};
