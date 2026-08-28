import type { ReactNode } from 'react';
import { IconButton } from '../IconButton/IconButton';
import { Tooltip } from '../Tooltip/Tooltip';
import { mergeClasses } from '../../utilities/mergeClasses';
import styles from './CanvasToolbar.module.css';

/** What `onInsert` asks `Canvas` to create — a small, fixed vocabulary rather than the full `CanvasBlockKind`/`CanvasShapeKind` product, since only a handful of combinations make sense as one-click, no-configuration inserts. */
export type CanvasInsertKind =
  'sticky' | 'shape-rectangle' | 'shape-ellipse' | 'shape-diamond' | 'node' | 'frame';

export interface CanvasToolbarProps {
  /** Which kind of block to create — `Canvas` owns the actual defaults (position, size, initial content). */
  onInsert: (kind: CanvasInsertKind) => void;
  className?: string;
}

function StickyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 2.5h7L13 5.5v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M10 2.5V5.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function RectangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="4" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="5.5" width="12" height="5" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 2.5 13.5 8 8 13.5 2.5 8 8 2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NodeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.5" y="6" width="9" height="4" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
      <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 5V2.5H5M11 2.5h2.5V5M13.5 11v2.5H11M5 13.5H2.5V11"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

const ITEMS: { kind: CanvasInsertKind; label: string; icon: ReactNode }[] = [
  { kind: 'sticky', label: 'Sticky note', icon: <StickyIcon /> },
  { kind: 'shape-rectangle', label: 'Rectangle', icon: <RectangleIcon /> },
  { kind: 'shape-ellipse', label: 'Pill', icon: <PillIcon /> },
  { kind: 'shape-diamond', label: 'Diamond', icon: <DiamondIcon /> },
  { kind: 'node', label: 'Node', icon: <NodeIcon /> },
  { kind: 'frame', label: 'Frame', icon: <FrameIcon /> },
];

/**
 * A small floating bar for adding content by hand — no `AIProvider` or
 * resolver required, unlike every other `Canvas` affordance. Each button is
 * one click: `onInsert` reports which kind, and `Canvas` decides position,
 * size and initial content, the same "toolbar reports intent, owner decides
 * geometry" split `aiDiagram`'s layout already draws.
 *
 * Docked to the bottom-centre of the surface in screen space (a sibling of
 * `.world`, not inside it), so panning and zooming the scene never carries
 * it along.
 */
export function CanvasToolbar({ onInsert, className }: CanvasToolbarProps) {
  return (
    <div
      className={mergeClasses(styles.toolbar, className)}
      role="toolbar"
      aria-label="Add to canvas"
      // A press here must not also read as a press on `Canvas`'s own surface —
      // that handler unconditionally takes pointer capture to start a marquee,
      // and a captured pointer never delivers its click to a button underneath
      // it, the exact "checklist box stopped ticking" failure mode this
      // library already guards against for controls inside a block.
      onPointerDown={(event) => event.stopPropagation()}
    >
      {ITEMS.map((item) => (
        <Tooltip key={item.kind} content={item.label}>
          <IconButton
            aria-label={`Add ${item.label.toLowerCase()}`}
            variant="ghost"
            size="sm"
            onClick={() => onInsert(item.kind)}
          >
            {item.icon}
          </IconButton>
        </Tooltip>
      ))}
    </div>
  );
}

CanvasToolbar.displayName = 'CanvasToolbar';
