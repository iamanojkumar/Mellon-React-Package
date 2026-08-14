import { useId } from 'react';
import { mergeClasses } from '../../utilities/mergeClasses';
import { connectorGeometry } from '../../utilities/canvasGeometry';
import type { CanvasConnectorData, CanvasScene } from '../../utilities/canvasReducer';
import styles from './CanvasConnector.module.css';

export interface CanvasConnectorProps {
  scene: CanvasScene;
  connector: CanvasConnectorData;
  selected?: boolean;
  onSelect?: (id: string) => void;
  className?: string;
}

/**
 * One edge, drawn from the two blocks' stored canvas rects.
 *
 * All the maths lives in `connectorGeometry` — nothing here measures the DOM,
 * which is what makes routing unit-testable in jsdom. A connector whose
 * endpoint has gone simply renders nothing rather than throwing mid-render.
 *
 * The whole SVG layer is `aria-hidden`; connections are reported as text in
 * `CanvasOutline` ("Login → Auth"), the same split as a chart's `aria-hidden`
 * plot and its table twin.
 */
export function CanvasConnector({
  scene,
  connector,
  selected = false,
  onSelect,
  className,
}: CanvasConnectorProps) {
  const markerId = useId();
  const geometry = connectorGeometry(scene, connector.from, connector.to, connector.variant);
  if (!geometry) return null;

  const arrow = connector.arrow ?? 'end';

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

      {/* Invisible fat stroke purely as a hit target — a 2px line is almost
          impossible to click, and widening the visible stroke to compensate
          would make every diagram heavier. */}
      <path
        d={geometry.path}
        className={styles.hitArea}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect?.(connector.id);
        }}
      />

      <path
        d={geometry.path}
        className={styles.path}
        markerEnd={arrow === 'end' || arrow === 'both' ? `url(#${markerId})` : undefined}
        markerStart={arrow === 'both' ? `url(#${markerId})` : undefined}
      />

      {connector.label && (
        <text x={geometry.labelPoint.x} y={geometry.labelPoint.y} className={styles.label}>
          {connector.label}
        </text>
      )}
    </g>
  );
}

CanvasConnector.displayName = 'CanvasConnector';
