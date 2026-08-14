import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Checkbox } from '../Checkbox/Checkbox';
import { mergeClasses } from '../../utilities/mergeClasses';
import { canvasBlockLabel, findCanvasBlock } from '../../utilities/canvasReducer';
import type {
  CanvasCommand,
  CanvasRejectedCommand,
  CanvasScene,
} from '../../utilities/canvasReducer';
import styles from './CanvasChangePreview.module.css';

export interface CanvasChangePreviewProps {
  /** The scene the commands were validated against — used to name blocks. */
  scene: CanvasScene;
  commands: CanvasCommand[];
  /** Commands dropped in validation, shown with reasons so nothing vanishes silently. */
  rejected?: CanvasRejectedCommand[];
  message?: ReactNode;
  onAccept: (commands: CanvasCommand[]) => void;
  onReject: () => void;
  heading?: ReactNode;
  className?: string;
}

function nameOf(scene: CanvasScene, id: string): string {
  const block = findCanvasBlock(scene, id);
  return block ? canvasBlockLabel(block) : id;
}

/**
 * Plain-language description of one command. Names blocks by **label**, not
 * id: ids exist so the model can be precise, but a human reviewing a batch
 * needs to recognise what's about to change.
 */
export function describeCanvasCommand(scene: CanvasScene, command: CanvasCommand): string {
  switch (command.op) {
    case 'create':
      return `Add ${command.block.kind} “${canvasBlockLabel(command.block)}”`;
    case 'move':
      return `Move “${nameOf(scene, command.id)}” to ${Math.round(command.x)}, ${Math.round(command.y)}`;
    case 'resize':
      return `Resize “${nameOf(scene, command.id)}” to ${Math.round(command.width)} × ${Math.round(command.height)}`;
    case 'update':
      return `Update ${Object.keys(command.patch).join(', ')} on “${nameOf(scene, command.id)}”`;
    case 'connect':
      return `Connect “${nameOf(scene, command.connector.from)}” to “${nameOf(scene, command.connector.to)}”`;
    case 'delete':
      return `Delete “${nameOf(scene, command.id)}”`;
  }
}

/**
 * The review step for a batch the canvas refused to auto-apply — anything
 * touching existing content, and anything destructive.
 *
 * Every command starts **checked**: the user is confirming a proposal, not
 * assembling one, and re-selecting thirty layout moves would make the feature
 * useless. Unchecking vetoes one item, and `applyCanvasCommands` re-validates
 * whatever survives — so unchecking a `create` whose block a later `connect`
 * depended on can't corrupt the scene; that connect is simply dropped.
 *
 * Presentational: it calls no AI client and mutates nothing.
 */
export function CanvasChangePreview({
  scene,
  commands,
  rejected = [],
  message,
  onAccept,
  onReject,
  heading = 'Proposed changes',
  className,
}: CanvasChangePreviewProps) {
  const [selected, setSelected] = useState<number[]>(() => commands.map((_, index) => index));

  /**
   * Describe against the scene *plus* the blocks this batch creates. A batch
   * that adds two notes and connects them would otherwise read "Connect n1 to
   * n2" — naming by id in precisely the case a human most needs a real name,
   * because those blocks don't exist in the scene yet.
   */
  const sceneWithPending: CanvasScene = {
    ...scene,
    blocks: [
      ...scene.blocks,
      ...commands.flatMap((command) => (command.op === 'create' ? [command.block] : [])),
    ],
  };

  // A new batch replaces the selection outright — carrying indices across
  // batches would silently re-check unrelated commands.
  useEffect(() => {
    setSelected(commands.map((_, index) => index));
  }, [commands]);

  const accepted = commands.filter((_, index) => selected.includes(index));

  return (
    <section className={mergeClasses(styles.preview, className)} aria-label="Proposed changes">
      <h3 className={styles.heading}>{heading}</h3>

      {message && <p className={styles.message}>{message}</p>}

      {commands.length > 0 && (
        <ul className={styles.list}>
          {commands.map((command, index) => (
            <li key={`${command.op}-${index}`} className={styles.item}>
              <Checkbox
                checked={selected.includes(index)}
                onCheckedChange={(checked) =>
                  setSelected((previous) =>
                    checked
                      ? [...previous, index]
                      : previous.filter((candidate) => candidate !== index),
                  )
                }
                label={describeCanvasCommand(sceneWithPending, command)}
                data-destructive={command.op === 'delete' ? '' : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <div className={styles.rejected}>
          <p className={styles.rejectedHeading}>
            {rejected.length === 1
              ? '1 change was ignored:'
              : `${rejected.length} changes were ignored:`}
          </p>
          <ul className={styles.rejectedList}>
            {rejected.map((entry, index) => (
              <li key={`${entry.command.op}-${index}`}>{entry.reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onReject}>
          Discard
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAccept(accepted)}
          disabled={accepted.length === 0}
        >
          {accepted.length === commands.length
            ? `Apply ${commands.length === 1 ? 'change' : 'all changes'}`
            : `Apply ${accepted.length} of ${commands.length}`}
        </Button>
      </div>
    </section>
  );
}

CanvasChangePreview.displayName = 'CanvasChangePreview';
