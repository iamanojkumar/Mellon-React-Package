import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { Progress } from '../Progress/Progress';
import { IconButton } from '../IconButton/IconButton';
import { mergeClasses } from '../../utilities/mergeClasses';
import visuallyHiddenStyles from '../VisuallyHidden/VisuallyHidden.module.css';
import styles from './FileUpload.module.css';

export type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface FileUploadFile {
  id: string;
  file: File;
  /** 0-100. Omit while the upload hasn't started or its size is unknown (renders `Progress`'s indeterminate animation). */
  progress?: number;
  status?: FileUploadStatus;
  error?: string;
}

export interface FileUploadRejection {
  file: File;
  reason: 'size' | 'type';
}

export interface FileUploadProps {
  /**
   * Fully controlled by the consumer — this component renders the list and
   * per-file `Progress`, but owns no upload transport or state of its own;
   * actually uploading (and reporting progress back into new `files`
   * entries) is the consumer's job, the same "presentation only" split
   * `DataGrid` draws around its own `data` prop.
   */
  files: FileUploadFile[];
  /** Called with newly picked/dropped files that passed `accept`/`maxSize` validation — merging them into `files` (with ids, initial status) is the consumer's job. */
  onFilesAdded: (files: File[]) => void;
  onRemove?: (id: string) => void;
  /** Called with files that failed `accept`/`maxSize` validation, instead of `onFilesAdded`. */
  onReject?: (rejections: FileUploadRejection[]) => void;
  /** Native `accept` syntax: comma-separated extensions (`.png`), MIME types (`image/png`), or MIME wildcards (`image/*`). */
  accept?: string;
  multiple?: boolean;
  /** Bytes. Files larger than this are rejected via `onReject` instead of `onFilesAdded`. */
  maxSize?: number;
  disabled?: boolean;
  /** Defaults to `'Upload files'`. */
  'aria-label'?: string;
  className?: string;
}

function matchesAccept(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const patterns = accept
    .split(',')
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern);
    if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
    return type === pattern;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * "Drag-and-drop is a mode, not a sibling" (docs/SPEC.md's Phase 17 note):
 * one `<label>` wrapping a real `<input type="file">` is simultaneously the
 * click-to-browse trigger *and* the drop target — not two components, not
 * even two separate code paths. Reuses `Checkbox`'s exact "native input
 * visually hidden via `VisuallyHidden`'s CSS, `<label>` click-forwarding
 * handles activation" shape, so the input stays keyboard-accessible (Tab
 * reaches it, Enter/Space opens the native file dialog) for free, no
 * hand-rolled `role="button"`/`onKeyDown` needed.
 *
 * `dragenter`/`dragleave` fire on every child boundary crossing, not just
 * the dropzone's own edges — the classic false-`dragleave`-while-still-
 * inside gotcha. Fixed with a counter (incremented on enter, decremented on
 * leave, only clearing the "dragging over" visual state at zero) rather
 * than a boolean, the standard fix for that class of bug.
 *
 * Fully controlled (`files`, no internal list state): unlike most
 * controllable-state components here, there's no sensible "uncontrolled"
 * default for entries whose `progress`/`status` the consumer's own async
 * upload code drives — the same reasoning `DataGrid` applies to its own
 * `data` prop. Reuses `Progress` (Phase 5) directly per file, and `Progress`
 * without a `value` renders indeterminate, which doubles as this
 * component's "queued, not yet started" visual with no extra state needed.
 */
export function FileUpload({
  files,
  onFilesAdded,
  onRemove,
  onReject,
  accept,
  multiple = true,
  maxSize,
  disabled = false,
  'aria-label': ariaLabel = 'Upload files',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  function processFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const rejected: FileUploadRejection[] = [];
    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        rejected.push({ file, reason: 'type' });
      } else if (maxSize !== undefined && file.size > maxSize) {
        rejected.push({ file, reason: 'size' });
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length > 0) onFilesAdded(accepted);
    if (rejected.length > 0) onReject?.(rejected);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) processFiles(event.target.files);
    // Reset so selecting the exact same file again still fires onChange.
    event.target.value = '';
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (disabled) return;
    dragCounterRef.current += 1;
    setIsDraggingOver(true);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    // Required so the browser allows a drop at all.
    event.preventDefault();
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDraggingOver(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);
    if (disabled) return;
    if (event.dataTransfer.files) processFiles(event.dataTransfer.files);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLLabelElement>) {
    // Space on a focused file input already opens the native dialog in
    // every browser that matters here; this is cheap insurance for Enter,
    // whose native behavior on `type="file"` is less consistently defined.
    // A second `.click()` after native behavior already opened the dialog
    // is a no-op, not a second dialog.
    if (event.key === 'Enter') {
      event.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className={mergeClasses(styles.fileUpload, className)}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- native <label>+<input> click-forwarding already makes this the real interactive surface (same pattern Checkbox uses); the drag handlers here are supplementary drop-target behavior, not new interaction semantics */}
      <label
        className={styles.dropzone}
        data-dragging-over={isDraggingOver || undefined}
        data-disabled={disabled || undefined}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
      >
        <input
          ref={inputRef}
          type="file"
          className={visuallyHiddenStyles.visuallyHidden}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={handleInputChange}
        />
        <span className={styles.instructions}>
          <strong>Click to upload</strong> or drag and drop
        </span>
        {accept && <span className={styles.hint}>{accept}</span>}
      </label>

      {files.length > 0 && (
        <ul className={styles.fileList}>
          {files.map((entry) => (
            <li key={entry.id} className={styles.fileRow} data-status={entry.status}>
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{entry.file.name}</span>
                <span className={styles.fileSize}>{formatBytes(entry.file.size)}</span>
              </div>
              {entry.status === 'error' ? (
                <span className={styles.errorText}>{entry.error ?? 'Upload failed'}</span>
              ) : (
                entry.status !== 'done' && (
                  <Progress
                    value={entry.progress}
                    size="sm"
                    label={`Uploading ${entry.file.name}`}
                    className={styles.fileProgress}
                  />
                )
              )}
              {onRemove && (
                <IconButton
                  aria-label={`Remove ${entry.file.name}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(entry.id)}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

FileUpload.displayName = 'FileUpload';
