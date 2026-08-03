import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileUpload } from './FileUpload';
import type { FileUploadFile } from './FileUpload';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

const meta: Meta<typeof FileUpload> = {
  title: 'Inputs/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `file-${idCounter}`;
}

export const Default: Story = {
  render: function DefaultFileUpload() {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    return (
      <FileUpload
        files={files}
        onFilesAdded={(added) => {
          setFiles((current) => [
            ...current,
            ...added.map((file) => ({
              id: nextId(),
              file,
              status: 'done' as const,
              progress: 100,
            })),
          ]);
        }}
        onRemove={(id) => setFiles((current) => current.filter((entry) => entry.id !== id))}
      />
    );
  },
};

export const Uploading: Story = {
  render: () => (
    <FileUpload
      files={[
        {
          id: '1',
          file: new File([new Uint8Array(1024 * 500)], 'presentation.pdf', {
            type: 'application/pdf',
          }),
          status: 'uploading',
          progress: 65,
        },
        {
          id: '2',
          file: new File([new Uint8Array(1024 * 120)], 'headshot.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
        },
        {
          id: '3',
          file: new File([new Uint8Array(1024 * 20)], 'notes.txt', { type: 'text/plain' }),
          status: 'error',
          error: 'File type not supported',
        },
      ]}
      onFilesAdded={() => {}}
      onRemove={() => {}}
    />
  ),
};

export const RestrictedToImages: Story = {
  render: function RestrictedFileUpload() {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    return (
      <FileUpload
        files={files}
        accept="image/*"
        maxSize={5 * 1024 * 1024}
        onFilesAdded={(added) =>
          setFiles((current) => [
            ...current,
            ...added.map((file) => ({
              id: nextId(),
              file,
              status: 'done' as const,
              progress: 100,
            })),
          ])
        }
        onReject={(rejections) => {
          console.log('rejected', rejections);
        }}
        onRemove={(id) => setFiles((current) => current.filter((entry) => entry.id !== id))}
      />
    );
  },
};

export const Disabled: Story = {
  render: () => <FileUpload files={[]} onFilesAdded={() => {}} disabled />,
};

export const Responsive: Story = {
  render: () => (
    <div style={{ maxWidth: 280 }}>
      <FileUpload files={[]} onFilesAdded={() => {}} />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <FileUpload
      files={[
        {
          id: '1',
          file: new File([new Uint8Array(1024)], 'photo.png', { type: 'image/png' }),
          status: 'uploading',
          progress: 40,
        },
      ]}
      onFilesAdded={() => {}}
      onRemove={() => {}}
    />
  ),
};

export const Controlled: Story = {
  render: function ControlledFileUpload() {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    return (
      <FileUpload
        files={files}
        onFilesAdded={(added) =>
          setFiles((current) => [
            ...current,
            ...added.map((file) => ({
              id: nextId(),
              file,
              status: 'uploading' as const,
              progress: 0,
            })),
          ])
        }
        onRemove={(id) => setFiles((current) => current.filter((entry) => entry.id !== id))}
      />
    );
  },
};

export const Uncontrolled: Story = {
  render: function UncontrolledFileUpload() {
    const [files, setFiles] = useState<FileUploadFile[]>([]);
    return (
      <FileUpload
        files={files}
        onFilesAdded={(added) =>
          setFiles((current) => [
            ...current,
            ...added.map((file) => ({
              id: nextId(),
              file,
              status: 'done' as const,
              progress: 100,
            })),
          ])
        }
        onRemove={(id) => setFiles((current) => current.filter((entry) => entry.id !== id))}
      />
    );
  },
};

const mockAIClient: AIClient = {
  complete: async () => 'A PNG image, likely a headshot or profile photo based on the file name.',
};

/**
 * `aiDescribe` is a no-op without an ancestor `AIProvider` — this story
 * wraps a deterministic mock client so each row's "Describe with AI"
 * trigger actually appears. One `useAIAction()` per row (via the internal
 * `FileUploadRow` component), so each file's status is independent.
 * Read-only: no accept/reject, just a description.
 */
export const WithAIDescribe: Story = {
  decorators: [
    (Story) => (
      <AIProvider client={mockAIClient}>
        <Story />
      </AIProvider>
    ),
  ],
  render: () => (
    <FileUpload
      files={[
        {
          id: '1',
          file: new File([new Uint8Array(1024 * 120)], 'headshot.png', { type: 'image/png' }),
          status: 'done',
          progress: 100,
        },
      ]}
      onFilesAdded={() => {}}
      onRemove={() => {}}
      aiDescribe
    />
  ),
};
