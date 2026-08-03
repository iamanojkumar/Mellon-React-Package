import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { MemoryListItem } from '../MemoryListItem/MemoryListItem';
import { Input } from '../Input/Input';
import { Button } from '../Button/Button';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './MemoryEditor.module.css';

export interface Memory {
  id: string;
  text: string;
}

export interface MemoryEditorProps {
  memories: Memory[];
  onForget: (id: string) => void;
  onAdd: (text: string) => void;
  addLabel?: string;
  placeholder?: string;
  forgetLabel?: string;
  emptyLabel?: ReactNode;
  className?: string;
}

/**
 * Saved/retrieved memory management: a `MemoryListItem` per entry (each
 * wired to `onForget`) plus a small add-new-memory form. A real `<form>`
 * (not a manual keydown handler) so Enter-to-submit and the "Add" button
 * both work via the platform's own submit behavior; the draft text is
 * local, ephemeral state this component owns — only committed values
 * (`onAdd`/`onForget`) reach the consumer.
 */
export function MemoryEditor({
  memories,
  onForget,
  onAdd,
  addLabel = 'Add',
  placeholder = 'Add a memory…',
  forgetLabel,
  emptyLabel = 'No saved memories yet.',
  className,
}: MemoryEditorProps) {
  const [draft, setDraft] = useState('');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft('');
  }

  return (
    <div className={mergeClasses(styles.editor, className)}>
      {memories.length === 0 ? (
        <p className={styles.empty}>{emptyLabel}</p>
      ) : (
        <ul className={styles.list}>
          {memories.map((memory) => (
            <MemoryListItem
              key={memory.id}
              forgetLabel={forgetLabel}
              onForget={() => onForget(memory.id)}
            >
              {memory.text}
            </MemoryListItem>
          ))}
        </ul>
      )}
      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          size="sm"
          className={styles.input}
          aria-label={placeholder}
          placeholder={placeholder}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button type="submit" size="sm" disabled={!draft.trim()}>
          {addLabel}
        </Button>
      </form>
    </div>
  );
}

MemoryEditor.displayName = 'MemoryEditor';
