import type { Meta, StoryObj } from '@storybook/react';
import { AudioWaveTranscriptionIcon, RecordIcon, StopIcon, FolderIcon } from '@mellon-design/icons';
import { IconButton } from './IconButton';
import type { ButtonSize } from '../Button/Button';

const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

const meta: Meta<typeof IconButton> = {
  title: 'Buttons/IconButton',
  component: IconButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  render: () => (
    <IconButton aria-label="Close">
      <span aria-hidden="true">×</span>
    </IconButton>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      {SIZES.map((size) => (
        <IconButton key={size} aria-label="Close" size={size}>
          <span aria-hidden="true">×</span>
        </IconButton>
      ))}
    </div>
  ),
};

export const Circle: Story = {
  render: () => (
    <IconButton aria-label="Close" shape="circle" variant="primary">
      <span aria-hidden="true">×</span>
    </IconButton>
  ),
};

export const Loading: Story = {
  render: () => (
    <IconButton aria-label="Saving" loading>
      <span aria-hidden="true">✓</span>
    </IconButton>
  ),
};

/** Icons sourced from the `@mellon-design/icons` package — verifies the package renders correctly inside `IconButton`. */
export const FromMellonIconsPackage: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 'var(--ds-space-sm)', alignItems: 'center' }}>
      <IconButton aria-label="Start recording" variant="danger">
        <RecordIcon />
      </IconButton>
      <IconButton aria-label="Stop recording">
        <StopIcon />
      </IconButton>
      <IconButton aria-label="Choose output folder" variant="secondary">
        <FolderIcon />
      </IconButton>
      <IconButton aria-label="Extract script" variant="secondary">
        <AudioWaveTranscriptionIcon />
      </IconButton>
    </div>
  ),
};
