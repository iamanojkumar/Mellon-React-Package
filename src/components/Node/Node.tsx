import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './Node.module.css';

export interface NodeProps {
  id: string;
  name: string;
  /** Double-clicking the name swaps it for a text input when supplied; without it the name is a static label. */
  onRename?: (name: string) => void;
  selected?: boolean;
  /** Set false for a source node with nothing feeding it. */
  hasInput?: boolean;
  /** Set false for a sink node nothing reads from. */
  hasOutput?: boolean;
  /** This node is the armed source of a pending connection — highlights its output port. */
  connecting?: boolean;
  width?: number;
  height?: number;
  /**
   * An arbitrary hex fill — user content, not a design token, the same
   * free-fill escape hatch as `StickyNote`/`CanvasShape`'s `color`. Drops
   * the default border/shadow for a flat chip look.
   */
  color?: string;
  /**
   * Fills its parent instead of self-positioning — for embedding inside an
   * already-positioned wrapper (a `CanvasBlock`), as opposed to the default
   * standalone use where `NodeGraph` places it via `style.left`/`style.top`.
   */
  fill?: boolean;
  style?: CSSProperties;
  className?: string;
  /** The node's held data, rendered however the consumer chooses — a string, a form, or an embedded `Canvas`/`Document`. */
  children?: ReactNode;
  onHeaderPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onSelect?: (id: string, additive: boolean) => void;
  onOutputPortClick?: (id: string) => void;
  onInputPortClick?: (id: string) => void;
}

/**
 * One node: a positioned, nameable box with an optional input port (left)
 * and output port (right). `Node` only renders and reports interactions —
 * position, dragging, and how ports resolve into connections are a
 * `NodeGraph`'s job, the same split `CanvasBlock` draws with `Canvas`.
 *
 * Ports are real `<button>`s, not decoration, so making a connection is
 * click-driven (arm an output, then click a target's input) rather than
 * pointer-drag-only — keyboard-reachable the same way every other
 * pointer-only gesture in this library gets a non-pointer path.
 */
export function Node({
  id,
  name,
  onRename,
  selected = false,
  hasInput = true,
  hasOutput = true,
  connecting = false,
  width,
  height,
  color,
  fill = false,
  style,
  className,
  children,
  onHeaderPointerDown,
  onSelect,
  onOutputPortClick,
  onInputPortClick,
}: NodeProps) {
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
      className={mergeClasses(styles.node, className)}
      data-selected={selected ? '' : undefined}
      data-fill={fill ? '' : undefined}
      data-filled={color ? '' : undefined}
      style={{
        ...style,
        ...(fill ? {} : { width, height }),
        ...(color ? { backgroundColor: color } : {}),
      }}
      role="group"
      aria-label={name}
      // `onSelect` is only ever omitted when a `CanvasBlock` already owns
      // selection for this element (embedded via `fill`) — stopping
      // propagation unconditionally would swallow the press before Canvas's
      // own drag/select handling ever saw it.
      {...(onSelect
        ? {
            onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => {
              // Selecting a node must not also read as a background press — a
              // `NodeGraph` clears its selection on that, which would undo the
              // selection this very press just made.
              event.stopPropagation();
              onSelect(id, event.shiftKey);
            },
          }
        : {})}
    >
      {hasInput &&
        (onInputPortClick ? (
          <button
            type="button"
            className={styles.port}
            data-port="input"
            aria-label={`Connect to ${name}'s input`}
            onClick={(event) => {
              event.stopPropagation();
              onInputPortClick(id);
            }}
          />
        ) : (
          // Inert in read-only contexts — the port still shows the graph's
          // shape, but isn't a control since there's nothing to connect it to.
          <span className={styles.port} data-port="input" aria-hidden="true" />
        ))}

      <div className={styles.header} onPointerDown={onHeaderPointerDown}>
        {editing ? (
          <input
            ref={inputRef}
            className={styles.nameInput}
            value={draft}
            aria-label="Node name"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              // Stays inside the input rather than reaching an ancestor's
              // keyboard handling — `NodeGraph`'s own arrow-key nudge and
              // Delete/Backspace would otherwise fire while typing a rename,
              // the same leak `CanvasShape`'s label input already guards.
              event.stopPropagation();
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
      </div>

      {/* Only rendered when there's held data — an empty body would add a
          padded, divider-bearing region under a node that's really just a
          label chip. */}
      {children != null && <div className={styles.body}>{children}</div>}

      {hasOutput &&
        (onOutputPortClick ? (
          <button
            type="button"
            className={styles.port}
            data-port="output"
            data-connecting={connecting ? '' : undefined}
            aria-label={`Connect ${name}'s output to another node`}
            onClick={(event) => {
              event.stopPropagation();
              onOutputPortClick(id);
            }}
          />
        ) : (
          <span className={styles.port} data-port="output" aria-hidden="true" />
        ))}
    </div>
  );
}

Node.displayName = 'Node';
