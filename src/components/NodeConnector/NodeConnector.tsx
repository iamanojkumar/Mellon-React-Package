import { useId } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { connectionPath } from '../../utilities/nodeGraph';
import type { NodePoint } from '../../utilities/nodeGraph';
import styles from './NodeConnector.module.css';

export interface NodeConnectorProps {
  id: string;
  from: NodePoint;
  to: NodePoint;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * One edge, drawn from two already-resolved port points — geometry lives in
 * `nodeGraph.ts`, nothing here measures the DOM. Mirrors `CanvasConnector`'s
 * split for the same reason: routing stays unit-testable, and a connector
 * whose node has gone is simply not rendered by the caller rather than
 * throwing mid-render.
 */
export function NodeConnector({
  id,
  from,
  to,
  selected = false,
  onSelect,
  className,
}: NodeConnectorProps) {
  const markerId = useId();
  const path = connectionPath(from, to);

  return (
    <g
      className={mergeClasses(styles.connector, className)}
      data-selected={selected ? '' : undefined}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className={styles.arrowhead} />
        </marker>
      </defs>

      {/* Invisible fat stroke purely as a hit target, same reasoning as CanvasConnector's. */}
      <path
        d={path}
        className={styles.hitArea}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect?.(id);
        }}
      />
      <path d={path} className={styles.path} markerEnd={`url(#${markerId})`} />
    </g>
  );
}

NodeConnector.displayName = 'NodeConnector';
