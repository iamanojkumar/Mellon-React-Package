import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { FileUpload } from './FileUpload';
import type { FileUploadFile } from './FileUpload';

function makeFile(name: string, size: number, type = 'image/png'): File {
  const file = new File([new Uint8Array(size)], name, { type });
  return file;
}

describe('FileUpload', () => {
  it('renders the file input labelled "Upload files" by default', () => {
    render(<FileUpload files={[]} onFilesAdded={vi.fn()} />);
    expect(screen.getByLabelText('Upload files')).toBeInTheDocument();
  });

  it('accepts a custom aria-label', () => {
    render(<FileUpload files={[]} onFilesAdded={vi.fn()} aria-label="Attach documents" />);
    expect(screen.getByLabelText('Attach documents')).toBeInTheDocument();
  });

  it('calls onFilesAdded when files are picked via the native input', async () => {
    const user = userEvent.setup();
    const onFilesAdded = vi.fn();
    render(<FileUpload files={[]} onFilesAdded={onFilesAdded} />);
    const file = makeFile('photo.png', 1024);
    await user.upload(screen.getByLabelText('Upload files'), file);
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it('calls onFilesAdded when files are dropped', () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload files={[]} onFilesAdded={onFilesAdded} />);
    const file = makeFile('photo.png', 1024);
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFilesAdded).toHaveBeenCalledWith([file]);
  });

  it('sets data-dragging-over while a drag is in progress, clearing on drop', () => {
    render(<FileUpload files={[]} onFilesAdded={vi.fn()} />);
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone).toHaveAttribute('data-dragging-over');
    fireEvent.drop(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone).not.toHaveAttribute('data-dragging-over');
  });

  it('does not clear the dragging-over state on a nested dragleave', () => {
    render(<FileUpload files={[]} onFilesAdded={vi.fn()} />);
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    // Two enters (dropzone, then a nested child) followed by one leave
    // (back out of the child) should still count as "inside".
    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone).toHaveAttribute('data-dragging-over');
  });

  it('rejects files over maxSize via onReject, not onFilesAdded', () => {
    const onFilesAdded = vi.fn();
    const onReject = vi.fn();
    render(
      <FileUpload files={[]} onFilesAdded={onFilesAdded} onReject={onReject} maxSize={1000} />,
    );
    const bigFile = makeFile('big.png', 2000);
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [bigFile] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith([{ file: bigFile, reason: 'size' }]);
  });

  it('rejects files that do not match accept via onReject', () => {
    const onFilesAdded = vi.fn();
    const onReject = vi.fn();
    render(
      <FileUpload files={[]} onFilesAdded={onFilesAdded} onReject={onReject} accept="image/*" />,
    );
    const textFile = makeFile('notes.txt', 100, 'text/plain');
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [textFile] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
    expect(onReject).toHaveBeenCalledWith([{ file: textFile, reason: 'type' }]);
  });

  it('renders a row per tracked file with name, size, and a progress bar', () => {
    const entries: FileUploadFile[] = [
      { id: '1', file: makeFile('photo.png', 2048), progress: 40, status: 'uploading' },
    ];
    render(<FileUpload files={entries} onFilesAdded={vi.fn()} />);
    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('shows an error message instead of a progress bar for an errored file', () => {
    const entries: FileUploadFile[] = [
      { id: '1', file: makeFile('photo.png', 2048), status: 'error', error: 'Too large' },
    ];
    render(<FileUpload files={entries} onFilesAdded={vi.fn()} />);
    expect(screen.getByText('Too large')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('hides the progress bar once a file is done', () => {
    const entries: FileUploadFile[] = [
      { id: '1', file: makeFile('photo.png', 2048), status: 'done', progress: 100 },
    ];
    render(<FileUpload files={entries} onFilesAdded={vi.fn()} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('calls onRemove with the file id when its remove button is clicked', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const entries: FileUploadFile[] = [{ id: 'abc', file: makeFile('photo.png', 1024) }];
    render(<FileUpload files={entries} onFilesAdded={vi.fn()} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove photo.png' }));
    expect(onRemove).toHaveBeenCalledWith('abc');
  });

  it('disables the input and ignores drops when disabled', () => {
    const onFilesAdded = vi.fn();
    render(<FileUpload files={[]} onFilesAdded={onFilesAdded} disabled />);
    expect(screen.getByLabelText('Upload files')).toBeDisabled();
    const dropzone = screen.getByLabelText('Upload files').closest('label')!;
    fireEvent.drop(dropzone, { dataTransfer: { files: [makeFile('a.png', 10)] } });
    expect(onFilesAdded).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const entries: FileUploadFile[] = [
      { id: '1', file: makeFile('photo.png', 2048), progress: 40, status: 'uploading' },
    ];
    const { container } = render(
      <FileUpload files={entries} onFilesAdded={vi.fn()} onRemove={vi.fn()} />,
    );
    await expectNoA11yViolations(container);
  });
});
