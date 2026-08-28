import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { IconButton } from '../IconButton/IconButton';
import styles from './NodeGroup.module.css';

export interface NodeGroupProps {
  name: string;
  /** Double-clicking the name swaps it for a text input when supplied. */
  onRename?: (name: string) => void;
  /** Dissolves the group — its member nodes are unaffected. Renders no control when unset. */
  onUngroup?: () => void;
  style?: CSSProperties;
  className?: string;
}

/**
 * The visible boundary a `NodeGroup` draws around its members, positioned by
 * `NodeGraph` from `groupBounds`. Membership itself is data (`NodeGroupData.nodeIds`),
 * not geometry — unlike `CanvasFrame`, this box is a rendering of that
 * membership, not the source of truth for it, so it can recompute its own
 * position from wherever its members currently sit without needing to know
 * anything about dragging.
 */
export function NodeGroup({ name, onRename, onUngroup, style, className }: NodeGroupProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEditing() {
    if (!onRename) return;
    setDraft(name);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onRename?.(trimmed);
    setEditing(false);
  }

  return (
    <div
      className={mergeClasses(styles.group, className)}
      style={style}
      role="group"
      aria-label={name}
    >
      {/* Stops a rename/ungroup press from also reading as a background press on the graph beneath it, which would clear the current selection out from under the click. */}
      <div className={styles.label} onPointerDown={(event) => event.stopPropagation()}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={draft}
            aria-label="Node group name"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setEditing(false);
              }
            }}
          />
        ) : (
          <span className={styles.name} {...(onRename ? { onDoubleClick: startEditing } : {})}>
            {name}
          </span>
        )}

        {onUngroup && (
          <IconButton aria-label={`Ungroup ${name}`} size="sm" variant="ghost" onClick={onUngroup}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M1 1L9 9M9 1L1 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </IconButton>
        )}
      </div>
    </div>
  );
}

NodeGroup.displayName = 'NodeGroup';
